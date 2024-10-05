// Finds the diff between the submitted lineups for a given team.
export const findLineupChanges = (prevWeekInfo, newWeekInfo) => {
    const diff = [];
    prevWeekInfo.forEach((prevWeek, weekIndex) => {
        const newWeek = newWeekInfo[weekIndex];
        if (!newWeek)
            return;
        const prevWeeklyLineup = prevWeek.finalizedLineup;
        const newWeeklyLineup = newWeek.finalizedLineup;
        Object.keys(prevWeeklyLineup).forEach((pos) => {
            if (pos === 'bench')
                return;
            const prevPlayers = prevWeeklyLineup[pos];
            const newPlayers = newWeeklyLineup[pos];
            prevPlayers.forEach((prevPlayer, playerIndex) => {
                const newPlayer = newPlayers[playerIndex];
                if (!prevPlayer || !newPlayer || prevPlayer.fullName !== newPlayer.fullName) {
                    const change = {
                        week: String(weekIndex),
                        newPlayer: newPlayer || undefined,
                        oldPlayer: prevPlayer || undefined,
                        position: pos,
                    };
                    diff.push(change);
                    console.log(`Week: ${change.week}, ` +
                        `${getPlayerDescription(change.oldPlayer)} -> ${getPlayerDescription(change.newPlayer)} ` +
                        `at position ${change.position}`);
                }
            });
        });
    });
    return diff;
};
function getPlayerDescription(player) {
    if (!player)
        return "(Empty)";
    if (player.fullName === "")
        return "(Bench)";
    return player.fullName;
}
//# sourceMappingURL=findLineupChanges.js.map