// Finds the diff between the submitted lineups for a given team.
export const findLineupChanges = (prevWeekInfo, newWeekInfo) => {
    const diff = [];
    for (let i = 0; i < prevWeekInfo.length; i++) {
        const prevWeeklyLineup = prevWeekInfo[i].finalizedLineup;
        const newWeeklyLineup = newWeekInfo[i].finalizedLineup;
        // Flatten the lineups & iterate over each position to find differences.
        Object.keys(prevWeeklyLineup).forEach((pos) => {
            for (let j = 0; j < prevWeeklyLineup[pos].length; j++) {
                const prevPlayer = prevWeeklyLineup[pos][j];
                const newPlayer = newWeeklyLineup[pos][j];
                if (prevPlayer.fullName !== newPlayer.fullName) {
                    diff.push({
                        week: String(i),
                        newPlayer: newPlayer,
                        oldPlayer: prevPlayer,
                        position: pos,
                    });
                }
            }
        });
    }
    return diff;
};
//# sourceMappingURL=findLineupChanges.js.map