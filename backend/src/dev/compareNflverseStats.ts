import { DatabasePlayer, League } from "@ff-mern/ff-types";
import { db } from "../config/firebase-config.js";
import { compareNflverseStats } from "../utils/nflverseParity.js";
import { loadNflverseWeeklyStats } from "../utils/nflverseWeekStats.js";

type Arguments = {
  season: number;
  week: number;
  leagueId?: string;
};

const usage =
  "Usage: pnpm --filter backend compare:nflverse -- <season> <week> [--league <leagueId>]";

const parseArguments = (args: string[]): Arguments => {
  const commandArgs = args[0] === "--" ? args.slice(1) : args;
  const [seasonText, weekText, ...options] = commandArgs;
  const season = Number(seasonText);
  const week = Number(weekText);
  if (!Number.isInteger(season) || !Number.isInteger(week) || week < 1) {
    throw new Error(usage);
  }
  const leagueFlag = options.indexOf("--league");
  const leagueId = leagueFlag >= 0 ? options[leagueFlag + 1] : undefined;
  if (leagueFlag >= 0 && !leagueId) throw new Error(usage);
  return { season, week, leagueId };
};

const run = async (): Promise<void> => {
  const { season, week, leagueId } = parseArguments(process.argv.slice(2));
  const weekStats = await db.collection("weekStats").doc(`${season}week${week}`).get();
  if (!weekStats.exists) {
    throw new Error(`No cached legacy stats exist for ${season} week ${week}.`);
  }
  const legacyStats = weekStats.data()?.playerMap as Record<string, DatabasePlayer>;
  if (!legacyStats || Object.keys(legacyStats).length === 0) {
    throw new Error(`The cached legacy stats for ${season} week ${week} are empty.`);
  }

  let league: League | undefined;
  if (leagueId) {
    const leagueDocument = await db.collection("leagues").doc(leagueId).get();
    if (!leagueDocument.exists) throw new Error(`League ${leagueId} was not found.`);
    league = leagueDocument.data() as League;
  }

  const nflverseStats = await loadNflverseWeeklyStats(season, week);
  const report = compareNflverseStats(
    legacyStats,
    nflverseStats,
    league?.scoringSettings
  );
  console.log(
    JSON.stringify(
      {
        season,
        week,
        leagueId: leagueId || null,
        ...report,
      },
      null,
      2
    )
  );
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
