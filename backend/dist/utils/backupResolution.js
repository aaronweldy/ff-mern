export const handleNonKickerBackupResolution = (team, player, week, snaps) => {
    const curDay = new Date().getDay();
    if (curDay > 1 &&
        curDay < 4 &&
        player.backup &&
        player.backup !== "None" &&
        player.lineup !== "bench" &&
        snaps === 0) {
        const curInd = team.weekInfo[week].finalizedLineup[player.lineup].findIndex((p) => p.name === player.name);
        let curPlayerRef = team.weekInfo[week].finalizedLineup[player.lineup][curInd];
        const backupInd = team.weekInfo[week].finalizedLineup.bench.findIndex((p) => p.name === player.backup);
        let backupPlayer = team.weekInfo[week].finalizedLineup.bench[backupInd];
        const tmpLineup = curPlayerRef.lineup;
        team.weekInfo[week].finalizedLineup[curPlayerRef.lineup][curInd] = Object.assign(Object.assign({}, backupPlayer), { lineup: tmpLineup });
        team.weekInfo[week].finalizedLineup.bench[backupInd] = Object.assign(Object.assign({}, curPlayerRef), { lineup: "bench" });
        return backupPlayer.name;
    }
    return player.name;
};
export const handleKickerBackupResolution = (team, player, week, data) => {
    const curDay = new Date().getDay();
    if (curDay > 1 && curDay < 4 && data[player.name].scoring.totalPoints === 0) {
        const playerRef = team.weekInfo[week].finalizedLineup[player.lineup].find((p) => p.name === player.name);
        const backupCheck = Object.entries(data).find(([_, altPlayer]) => altPlayer.position === "K" &&
            altPlayer.team === player.team &&
            altPlayer.scoring.totalPoints > 0);
        // If a backup is found, the kicker didn't play, so score the player from the same team.
        if (backupCheck) {
            playerRef.name = backupCheck[0];
            return backupCheck[0];
        }
    }
    // Otherwise they did play, & just scored 0 points.
    return player.name;
};
//# sourceMappingURL=backupResolution.js.map