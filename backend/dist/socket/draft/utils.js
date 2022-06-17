var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ProjectedPlayer, getEmptyLineupFromSettings, positionTypes, } from "@ff-mern/ff-types";
import { db } from "../../config/firebase-config.js";
export const rebuildPlayersAndSelections = (roomId) => __awaiter(void 0, void 0, void 0, function* () {
    let availablePlayers = [];
    let selections = {};
    let draftState;
    console.log(roomId);
    const draftRef = db.collection("drafts").doc(roomId);
    const [curState, players, selectionsRef] = yield Promise.all([
        draftRef.get(),
        draftRef.collection("availablePlayers").orderBy("overall", "asc").get(),
        draftRef.collection("selections").get(),
    ]);
    if (curState.exists) {
        const league = (yield db.collection("leagues").doc(curState.data().leagueId).get()).data();
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
        return { draftState, availablePlayers, selections, league };
    }
    else {
        throw new Error("Draft does not exist");
    }
});
export const buildPlayersByTeam = (lineupSettings, teamIds, selections) => {
    const playersByTeam = {};
    teamIds.forEach((teamId) => {
        playersByTeam[teamId] = getEmptyLineupFromSettings(lineupSettings, { createEmptyPlayer: ProjectedPlayer["createEmptyPlayer"] });
    });
    const remainingPlayersByTeam = teamIds.reduce((acc, cur) => {
        acc[cur] = Object.assign({}, lineupSettings);
        return acc;
    }, {});
    if (selections) {
        selections.forEach((selection) => {
            const teamId = selection.selectedBy.id;
            const player = selection.player;
            if (selection.player) {
                const availablePositions = positionTypes.filter((pos) => pos.includes(player.position));
                let foundPos = false;
                for (const pos of availablePositions) {
                    const remainingAtPos = remainingPlayersByTeam[teamId][pos];
                    if (remainingAtPos === 0) {
                        continue;
                    }
                    playersByTeam[teamId][pos][lineupSettings[pos] - remainingAtPos] =
                        player;
                    remainingPlayersByTeam[teamId][pos] -= 1;
                    foundPos = true;
                    break;
                }
                if (!foundPos) {
                    playersByTeam[teamId].bench.push(player);
                }
            }
        });
    }
    return playersByTeam;
};
export const addPlayerToTeam = (playersByTeam, pick) => {
    const teamId = pick.selectedBy.id;
    const player = pick.player;
    const availablePositions = positionTypes.filter((pos) => pos.includes(player.position));
    let foundPos = false;
    for (const pos of availablePositions) {
        for (let i = 0; i < playersByTeam[teamId][pos].length; i++) {
            const playerAtInd = playersByTeam[teamId][pos][i];
            if (!playerAtInd.fullName) {
                playersByTeam[teamId][pos][i] = player;
                foundPos = true;
                break;
            }
        }
        if (foundPos) {
            break;
        }
    }
};
export const linearizeSelections = (selections) => Object.keys(selections).reduce((acc, round) => {
    return acc.concat(selections[round]);
}, []);
//# sourceMappingURL=utils.js.map