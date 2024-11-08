import { sanitizePlayerName, setPlayerName, } from "@ff-mern/ff-types";
export const handleNonKickerBackupResolution = (team, player, week, snaps, points) => {
    const datePST = new Date().toLocaleString('en-US', { timeZone: "America/Los_Angeles" });
    const curDay = new Date(datePST).getDay();
    if (curDay > 1 &&
        curDay < 4 &&
        player.backup &&
        player.backup !== "None" &&
        player.lineup !== "bench" &&
        points === 0 &&
        ((week == 1 && isNaN(snaps)) || snaps === 0)) {
        console.log("Replacing " + player.fullName + " with backup " + player.backup);
        const curInd = team.weekInfo[week].finalizedLineup[player.lineup].findIndex((p) => p.fullName === player.fullName);
        let curPlayerRef = team.weekInfo[week].finalizedLineup[player.lineup][curInd];
        const backupInd = team.weekInfo[week].finalizedLineup.bench.findIndex((p) => p.fullName === player.backup);
        let backupPlayer = team.weekInfo[week].finalizedLineup.bench[backupInd];
        const tmpLineup = curPlayerRef.lineup;
        team.weekInfo[week].finalizedLineup[curPlayerRef.lineup][curInd] = Object.assign(Object.assign({}, backupPlayer), { lineup: tmpLineup });
        team.weekInfo[week].finalizedLineup.bench[backupInd] = Object.assign(Object.assign({}, curPlayerRef), { lineup: "bench" });
        return backupPlayer.sanitizedName;
    }
    return player.sanitizedName;
};
export const handleKickerBackupResolution = (team, player, week, data) => {
    const datePST = new Date().toLocaleString('en-US', { timeZone: "America/Los_Angeles" });
    const curDay = new Date(datePST).getDay();
    if (curDay > 1 &&
        curDay < 4 &&
        data[player.sanitizedName].scoring.totalPoints === 0) {
        const playerRef = team.weekInfo[week].finalizedLineup[player.lineup].find((p) => p.fullName === player.fullName);
        const backupCheck = Object.entries(data).find(([_, altPlayer]) => altPlayer.position === "K" &&
            altPlayer.team === player.team &&
            altPlayer.scoring.totalPoints > 0);
        // If a backup is found, the kicker didn't play, so score the player from the same team.
        if (backupCheck) {
            const newName = backupCheck[0]
                .split(" ")
                .map((name) => name[0].toUpperCase() + name.slice(1))
                .join(" ");
            console.log("Replacing kicker " + player.fullName + " with backup " + backupCheck[0]);
            setPlayerName(playerRef, newName);
            return sanitizePlayerName(backupCheck[0]);
        }
    }
    // Otherwise they did play, & just scored 0 points.
    return player.sanitizedName;
};
//# sourceMappingURL=backupResolution.js.map