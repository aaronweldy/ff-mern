import { ProjectedPlayer, getEmptyLineupFromSettings, positionTypes, } from "@ff-mern/ff-types";
import { db } from "../../config/firebase-config.js";
export const rebuildPlayersAndSelections = async (roomId) => {
    let availablePlayers = [];
    let selections = {};
    let draftState;
    console.log("rebuilding state for", roomId);
    const draftRef = db.collection("drafts").doc(roomId);
    const [curState, players, selectionsRef] = await Promise.all([
        draftRef.get(),
        draftRef.collection("availablePlayers").orderBy("overall", "asc").get(),
        draftRef.collection("selections").get(),
    ]);
    if (curState.exists) {
        const league = (await db.collection("leagues").doc(curState.data().leagueId).get()).data();
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
        console.log(roomId, "state is", draftState);
        return { draftState, availablePlayers, selections, league };
    }
    else {
        throw new Error("Draft does not exist");
    }
};
export const buildPlayersByTeam = (lineupSettings, teamIds, selections) => {
    const playersByTeam = {};
    teamIds.forEach((teamId) => {
        playersByTeam[teamId] = getEmptyLineupFromSettings(lineupSettings, { createEmptyPlayer: ProjectedPlayer["createEmptyPlayer"] });
    });
    const remainingPlayersByTeam = teamIds.reduce((acc, cur) => {
        acc[cur] = { ...lineupSettings };
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
    if (!foundPos) {
        playersByTeam[teamId].bench.push(player);
    }
};
export const linearizeSelections = (selections) => Object.keys(selections).reduce((acc, round) => {
    return acc.concat(selections[round]);
}, []);
//# sourceMappingURL=utils.js.map