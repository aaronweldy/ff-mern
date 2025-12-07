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
  snaps: number,
  points: number
) => {
  const datePST = new Date().toLocaleString('en-US', { timeZone: "America/Los_Angeles" });
  const curDay = new Date(datePST).getDay();
  // Trigger backup resolution when player scored 0 points and either:
  // - Has 0 snaps (explicitly recorded as not playing)
  // - Has no snap data (NaN - data might be missing for some players)
  if (
    curDay > 1 &&
    curDay < 4 &&
    player.backup &&
    player.backup !== "None" &&
    player.lineup !== "bench" &&
    points === 0 &&
    (snaps === 0 || isNaN(snaps))
  ) {
    console.log("Replacing " + player.fullName + " with backup " + player.backup);
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
  const datePST = new Date().toLocaleString('en-US', { timeZone: "America/Los_Angeles" });
  const curDay = new Date(datePST).getDay();
  if (
    curDay > 1 &&
    curDay < 4 &&
    data[player.sanitizedName].scoring.totalPoints === 0
  ) {
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
