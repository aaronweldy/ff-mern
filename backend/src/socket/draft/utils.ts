import { DraftState, ProjectedPlayer, DraftPick } from "@ff-mern/ff-types";
import { db } from "../../config/firebase-config.js";

export const rebuildPlayersAndSelections = async (roomId: string) => {
  let availablePlayers: ProjectedPlayer[] = [];
  let selections: Record<string, DraftPick[]> = {};
  let draftState: DraftState;
  const draftRef = db.collection("drafts").doc(roomId);
  const [curState, players, selectionsRef] = await Promise.all([
    draftRef.get(),
    draftRef.collection("availablePlayers").orderBy("overall", "asc").get(),
    draftRef.collection("selections").get(),
  ]);
  if (curState.exists) {
    draftState = curState.data() as DraftState;
    const picksPerRound = draftState.settings.draftOrder.length;
    selectionsRef.forEach((pick) => {
      const pickData = pick.data();
      const round = Math.floor(pickData.pick / picksPerRound);
      const pickInRound = pickData.pick % picksPerRound;
      if (!selections[round]) {
        selections[round] = [];
      }
      selections[round][pickInRound] = pick.data() as DraftPick;
    });
    players.forEach((playerRef) => {
      availablePlayers.push(playerRef.data() as ProjectedPlayer);
    });
  }
  return { draftState, availablePlayers, selections };
};
