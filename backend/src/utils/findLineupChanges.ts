import { FinalizedPlayer, Position, TeamWeekInfo, Week } from "@ff-mern/ff-types"

export type LineupDiff = {
    week: Week;
    newPlayer?: FinalizedPlayer;
    oldPlayer?: FinalizedPlayer;
    position: Position;
}

// Finds the diff between the submitted lineups for a given team.
export const findLineupChanges = (prevWeekInfo: TeamWeekInfo[], newWeekInfo: TeamWeekInfo[]): LineupDiff[] => {
    const diff: LineupDiff[] = [];

    prevWeekInfo.forEach((prevWeek, weekIndex) => {
        const newWeek = newWeekInfo[weekIndex];
        if (!newWeek) return;

        const prevWeeklyLineup = prevWeek.finalizedLineup;
        const newWeeklyLineup = newWeek.finalizedLineup;

        (Object.keys(prevWeeklyLineup) as Position[]).forEach((pos) => {
            if (pos === 'bench') return;

            const prevPlayers = prevWeeklyLineup[pos];
            const newPlayers = newWeeklyLineup[pos];

            prevPlayers.forEach((prevPlayer, playerIndex) => {
                const newPlayer = newPlayers[playerIndex];

                if (!prevPlayer || !newPlayer || prevPlayer.fullName !== newPlayer.fullName) {
                    const change: LineupDiff = {
                        week: String(weekIndex) as Week,
                        newPlayer: newPlayer || undefined,
                        oldPlayer: prevPlayer || undefined,
                        position: pos,
                    };
                    diff.push(change);

                    console.log(
                        `Week: ${change.week}, ` +
                        `${getPlayerDescription(change.oldPlayer)} -> ${getPlayerDescription(change.newPlayer)} ` +
                        `at position ${change.position}`
                    );
                }
            });
        });
    });

    return diff;
};

function getPlayerDescription(player?: FinalizedPlayer): string {
    if (!player) return "(Empty)";
    if (player.fullName === "") return "(Bench)";
    return player.fullName;
}