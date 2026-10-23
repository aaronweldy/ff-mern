import {
  Team,
  FinalizedPlayer,
  PlayerScoreData,
  ScoringError,
  lineupSorter,
  Position,
} from "@ff-mern/ff-types";
import { scoringName } from "./scoringNames.js";

const normalizeTeam = (team: string) =>
  team.replace(/^WAS$/, "WSH").replace(/^JAC$/, "JAX");

export const resolveScoringLineup = (
  team: Team,
  week: number,
  data: PlayerScoreData,
  completed: Set<string>
) => {
  const source = team.weekInfo[week]?.finalizedLineup;
  if (!source)
    throw new Error(`Missing lineup for team ${team.id}, week ${week}`);
  const lineup = JSON.parse(JSON.stringify(source)) as typeof source;
  const errors: ScoringError[] = [];
  const substitutions: { starter: string; backup: string; slot: string }[] = [];
  const used = new Set(
    Object.entries(source)
      .filter(([slot]) => slot !== "bench")
      .flatMap(([, players]) =>
        players.map((p) => scoringName(p.sanitizedName))
      )
  );
  const warn = (p: FinalizedPlayer, reason: string) =>
    errors.push(new ScoringError("POSSIBLE BACKUP", reason, p, team));
  for (const slot of Object.keys(source)
    .filter((s) => s !== "bench")
    .sort((a, b) => lineupSorter(a as Position, b as Position))) {
    for (const [index, player] of source[slot as Position].entries()) {
      if (!player.fullName) continue;
      const stats = data[player.sanitizedName];
      if (!stats || !Number.isFinite(stats.scoring.totalPoints)) {
        warn(
          player,
          `Missing scoring data for ${player.fullName}; counted as zero.`
        );
        continue;
      }
      const games = stats.statistics.G;
      if (
        !completed.has(normalizeTeam(stats.team)) ||
        typeof games !== "string" ||
        games.trim() === "" ||
        Number(games) !== 0 ||
        stats.scoring.totalPoints !== 0
      )
        continue;
      let backup: FinalizedPlayer | undefined;
      if (player.position === "K") {
        const replacement = Object.entries(data)
          .sort(([a], [b]) => a.localeCompare(b))
          .find(
            ([name, value]) =>
              scoringName(name) !== scoringName(player.sanitizedName) &&
              value.position === "K" &&
              normalizeTeam(value.team) === normalizeTeam(stats.team) &&
              Number.isFinite(value.scoring.totalPoints) &&
              value.scoring.totalPoints > 0 &&
              !used.has(scoringName(name))
          );
        if (replacement)
          backup = {
            ...player,
            sanitizedName: replacement[0],
            fullName: replacement[1].statistics.Player || replacement[0],
          };
      } else if (player.backup && player.backup !== "None") {
        backup = source.bench?.find((p) => p.fullName === player.backup);
        if (
          !backup ||
          used.has(scoringName(backup.sanitizedName)) ||
          !slot.split("/").includes(backup.position) ||
          !data[backup.sanitizedName] ||
          !Number.isFinite(data[backup.sanitizedName].scoring.totalPoints)
        ) {
          warn(
            player,
            `Backup ${player.backup} is unavailable, already used, ineligible, or missing scoring data; retained ${player.fullName}.`
          );
          continue;
        }
      }
      if (!backup) continue;
      used.add(scoringName(backup.sanitizedName));
      lineup[slot as Position][index] = { ...backup, lineup: slot as Position };
      const benchIndex =
        lineup.bench?.findIndex(
          (p) => p.sanitizedName === backup!.sanitizedName
        ) ?? -1;
      if (benchIndex >= 0)
        lineup.bench[benchIndex] = { ...player, lineup: "bench" };
      substitutions.push({
        starter: player.fullName,
        backup: backup.fullName,
        slot,
      });
    }
  }
  const weekScore = Object.entries(lineup)
    .filter(([slot]) => slot !== "bench")
    .flatMap(([, players]) => players)
    .reduce((total, player) => {
      const points = data[player.sanitizedName]?.scoring.totalPoints;
      return total + (Number.isFinite(points) ? points : 0);
    }, 0);
  return { lineup, substitutions, errors, weekScore };
};

type Scoreboard = {
  season?: { year?: number; type?: number };
  week?: { number?: number };
  events?: {
    competitions?: {
      status?: { type?: { completed?: boolean } };
      competitors?: { team?: { abbreviation?: string } }[];
    }[];
  }[];
};

export const completedTeamsFromScoreboard = (
  board: Scoreboard,
  year: number,
  week: number
): Set<string> => {
  const result = new Set<string>();
  if (
    Number(board.season?.year) !== year ||
    Number(board.week?.number) !== week ||
    Number(board.season?.type) !== 2
  )
    return result;
  for (const event of board.events ?? [])
    for (const competition of event.competitions ?? []) {
      if (competition.status?.type?.completed !== true) continue;
      for (const competitor of competition.competitors ?? [])
        if (typeof competitor.team?.abbreviation === "string")
          result.add(normalizeTeam(competitor.team.abbreviation));
    }
  return result;
};

const GAME_STATUS_CACHE_TTL_MS = 5 * 60 * 1000;
const GAME_STATUS_ATTEMPTS = 3;

class GameStatusHttpError extends Error {
  constructor(readonly status: number, details: Record<string, unknown>) {
    super(`Game status request failed: ${status} ${JSON.stringify(details)}`);
  }
}

/** One cache per server process, shared by scheduled and manual league runs. */
export const createCompletedTeamsFetcher = (
  dependencies: {
    fetch?: typeof fetch;
    now?: () => number;
    sleep?: (milliseconds: number) => Promise<void>;
    warn?: (details: Record<string, unknown>) => void;
  } = {}
) => {
  const request: typeof fetch =
    dependencies.fetch ?? ((...args) => fetch(...args));
  const now = dependencies.now ?? (() => Date.now());
  const sleep: (milliseconds: number) => Promise<void> =
    dependencies.sleep ??
    ((milliseconds) =>
      new Promise((resolve) => setTimeout(resolve, milliseconds)));
  const warn =
    dependencies.warn ?? ((details) => console.warn(JSON.stringify(details)));
  const cache = new Map<string, { teams: Set<string>; expiresAt: number }>();
  const inflight = new Map<string, Promise<Set<string>>>();

  const load = async (year: number, week: number): Promise<Set<string>> => {
    const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${year}&seasontype=2&week=${week}&limit=100`;
    for (let attempt = 1; attempt <= GAME_STATUS_ATTEMPTS; attempt++) {
      const controller = new AbortController();
      // Includes reading the response body; no attempt may hang indefinitely.
      const timeout = setTimeout(() => controller.abort(), 5000);
      let failure: Error;
      let retryable = true;
      try {
        const response = await request(url, { signal: controller.signal });
        if (!response.ok) {
          const details = {
            year,
            week,
            attempt,
            url,
            statusText: response.statusText,
            contentType: response.headers.get("content-type"),
            server: response.headers.get("server"),
            retryAfter: response.headers.get("retry-after"),
            requestId:
              response.headers.get("x-amz-cf-id") ??
              response.headers.get("x-request-id"),
          };
          await response.body?.cancel();
          // Log selected diagnostic fields, never cookies or authorization headers.
          throw new GameStatusHttpError(response.status, details);
        }
        const board: Scoreboard = await response.json();
        if (
          !board ||
          Number(board.season?.year) !== year ||
          Number(board.week?.number) !== week ||
          Number(board.season?.type) !== 2 ||
          !Array.isArray(board.events)
        ) {
          retryable = false;
          throw new Error(
            `Invalid game status scoreboard for season ${year}, week ${week}`
          );
        }
        return completedTeamsFromScoreboard(board, year, week);
      } catch (error) {
        failure = error instanceof Error ? error : new Error(String(error));
        if (error instanceof GameStatusHttpError)
          retryable = [403, 429].includes(error.status) || error.status >= 500;
      } finally {
        clearTimeout(timeout);
      }
      warn({
        event: "game_status_request_failed",
        year,
        week,
        attempt,
        retrying: retryable && attempt < GAME_STATUS_ATTEMPTS,
        error: failure.message,
      });
      if (!retryable || attempt === GAME_STATUS_ATTEMPTS)
        throw new Error(
          `Game status unavailable for season ${year}, week ${week} after ${attempt} attempt(s): ${failure.message}`
        );
      await sleep(250 * 2 ** (attempt - 1));
    }
    throw new Error("Game status attempts exhausted");
  };

  return async (year: number, week: number): Promise<Set<string>> => {
    const key = `${year}:${week}`;
    const timestamp = now();
    for (const [cachedKey, entry] of cache)
      if (entry.expiresAt <= timestamp) cache.delete(cachedKey);
    const cached = cache.get(key);
    if (cached) return new Set(cached.teams);

    let pending = inflight.get(key);
    if (!pending) {
      pending = load(year, week)
        .then((teams) => {
          cache.set(key, {
            teams,
            expiresAt: now() + GAME_STATUS_CACHE_TTL_MS,
          });
          return teams;
        })
        .finally(() => inflight.delete(key));
      inflight.set(key, pending);
    }
    // Callers cannot mutate the cache or another league's completion status.
    return new Set(await pending);
  };
};

export const fetchCompletedTeams = createCompletedTeamsFetcher();
