import {
  Team,
  FinalizedPlayer,
  PlayerScoreData,
  sanitizePlayerName,
  setPlayerName,
} from "@ff-mern/ff-types";

export const handleNonKickerBackupResolution = (
  team: Team,
  player: FinalizedPlayer,
  week: number,
  snaps: number
) => {
  const curDay = new Date().getDay();
  if (
    curDay > 1 &&
    curDay < 4 &&
    player.backup &&
    player.backup !== "None" &&
    player.lineup !== "bench" &&
    snaps === 0
  ) {
    console.log("processing backup for", player);
    const curInd = team.weekInfo[week].finalizedLineup[player.lineup].findIndex(
      (p) => p.fullName === player.fullName
    );
    let curPlayerRef =
      team.weekInfo[week].finalizedLineup[player.lineup][curInd];
    const backupInd = team.weekInfo[week].finalizedLineup.bench.findIndex(
      (p) => p.fullName === player.backup
    );
    let backupPlayer = team.weekInfo[week].finalizedLineup.bench[backupInd];
    const tmpLineup = curPlayerRef.lineup;
    team.weekInfo[week].finalizedLineup[curPlayerRef.lineup][curInd] = {
      ...backupPlayer,
      lineup: tmpLineup,
    };
    team.weekInfo[week].finalizedLineup.bench[backupInd] = {
      ...curPlayerRef,
      lineup: "bench",
    };
    return backupPlayer.sanitizedName;
  }
  return player.sanitizedName;
};

export const handleKickerBackupResolution = (
  team: Team,
  player: FinalizedPlayer,
  week: number,
  data: PlayerScoreData
) => {
  const curDay = new Date().getDay();
  if (
    curDay > 1 &&
    curDay < 4 &&
    data[player.sanitizedName].scoring.totalPoints === 0
  ) {
    console.log("processing kicker backup for", player);
    const playerRef = team.weekInfo[week].finalizedLineup[player.lineup].find(
      (p) => p.fullName === player.fullName
    );
    const backupCheck = Object.entries(data).find(
      ([_, altPlayer]) =>
        altPlayer.position === "K" &&
        altPlayer.team === player.team &&
        altPlayer.scoring.totalPoints > 0
    );
    // If a backup is found, the kicker didn't play, so score the player from the same team.
    if (backupCheck) {
      setPlayerName(playerRef, backupCheck[0]);
      return sanitizePlayerName(backupCheck[0]);
    }
  }
  // Otherwise they did play, & just scored 0 points.
  return player.sanitizedName;
};
