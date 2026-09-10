import { ScoringError, lineupSorter, } from "@ff-mern/ff-types";
const normalizeTeam = (team) => team.replace(/^WAS$/, "WSH").replace(/^JAC$/, "JAX");
export const resolveScoringLineup = (team, week, data, completed) => {
    const source = team.weekInfo[week]?.finalizedLineup;
    if (!source)
        throw new Error(`Missing lineup for team ${team.id}, week ${week}`);
    const lineup = JSON.parse(JSON.stringify(source));
    const errors = [];
    const substitutions = [];
    const used = new Set(Object.entries(source)
        .filter(([slot]) => slot !== "bench")
        .flatMap(([, players]) => players.map((p) => p.sanitizedName)));
    const warn = (p, reason) => errors.push(new ScoringError("POSSIBLE BACKUP", reason, p, team));
    for (const slot of Object.keys(source)
        .filter((s) => s !== "bench")
        .sort((a, b) => lineupSorter(a, b))) {
        for (const [index, player] of source[slot].entries()) {
            if (!player.fullName)
                continue;
            const stats = data[player.sanitizedName];
            if (!stats || !Number.isFinite(stats.scoring.totalPoints)) {
                warn(player, `Missing scoring data for ${player.fullName}; counted as zero.`);
                continue;
            }
            const games = stats.statistics.G;
            if (!completed.has(normalizeTeam(stats.team)) ||
                typeof games !== "string" ||
                games.trim() === "" ||
                Number(games) !== 0 ||
                stats.scoring.totalPoints !== 0)
                continue;
            let backup;
            if (player.position === "K") {
                const replacement = Object.entries(data)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .find(([name, value]) => name !== player.sanitizedName &&
                    value.position === "K" &&
                    normalizeTeam(value.team) === normalizeTeam(stats.team) &&
                    Number.isFinite(value.scoring.totalPoints) &&
                    value.scoring.totalPoints > 0 &&
                    !used.has(name));
                if (replacement)
                    backup = {
                        ...player,
                        sanitizedName: replacement[0],
                        fullName: replacement[1].statistics.Player || replacement[0],
                    };
            }
            else if (player.backup && player.backup !== "None") {
                backup = source.bench?.find((p) => p.fullName === player.backup);
                if (!backup ||
                    used.has(backup.sanitizedName) ||
                    !slot.split("/").includes(backup.position) ||
                    !data[backup.sanitizedName] ||
                    !Number.isFinite(data[backup.sanitizedName].scoring.totalPoints)) {
                    warn(player, `Backup ${player.backup} is unavailable, already used, ineligible, or missing scoring data; retained ${player.fullName}.`);
                    continue;
                }
            }
            if (!backup)
                continue;
            used.add(backup.sanitizedName);
            lineup[slot][index] = { ...backup, lineup: slot };
            const benchIndex = lineup.bench?.findIndex((p) => p.sanitizedName === backup.sanitizedName) ?? -1;
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
export const completedTeamsFromScoreboard = (board, year, week) => {
    const result = new Set();
    if (Number(board.season?.year) !== year ||
        Number(board.week?.number) !== week ||
        Number(board.season?.type) !== 2)
        return result;
    for (const event of board.events ?? [])
        for (const competition of event.competitions ?? []) {
            if (competition.status?.type?.completed !== true)
                continue;
            for (const competitor of competition.competitors ?? [])
                if (typeof competitor.team?.abbreviation === "string")
                    result.add(normalizeTeam(competitor.team.abbreviation));
        }
    return result;
};
export const fetchCompletedTeams = async (year, week) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
        const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${year}&seasontype=2&week=${week}&limit=100`, { signal: controller.signal });
        if (!response.ok)
            throw new Error(`Game status request failed: ${response.status}`);
        return completedTeamsFromScoreboard(await response.json(), year, week);
    }
    finally {
        clearTimeout(timeout);
    }
};
//# sourceMappingURL=scoringResolution.js.map