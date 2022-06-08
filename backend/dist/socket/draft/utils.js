var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { db } from "../../config/firebase-config.js";
export const rebuildPlayersAndSelections = (roomId) => __awaiter(void 0, void 0, void 0, function* () {
    let availablePlayers = [];
    let selections = {};
    let draftState;
    const draftRef = db.collection("drafts").doc(roomId);
    const [curState, players, selectionsRef] = yield Promise.all([
        draftRef.get(),
        draftRef.collection("availablePlayers").orderBy("overall", "asc").get(),
        draftRef.collection("selections").get(),
    ]);
    if (curState.exists) {
        draftState = curState.data();
        const picksPerRound = draftState.settings.draftOrder.length;
        selectionsRef.forEach((pick) => {
            const pickData = pick.data();
            const round = Math.floor(pickData.pick / picksPerRound);
            const pickInRound = pickData.pick % picksPerRound;
            if (!selections[round]) {
                selections[round] = [];
            }
            selections[round][pickInRound] = pick.data();
        });
        players.forEach((playerRef) => {
            availablePlayers.push(playerRef.data());
        });
        return { draftState, availablePlayers, selections };
    }
    else {
        throw new Error("Draft does not exist");
    }
});
//# sourceMappingURL=utils.js.map