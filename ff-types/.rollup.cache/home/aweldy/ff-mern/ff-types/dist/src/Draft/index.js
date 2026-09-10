import { mapTeamsToIds } from "../Team";
import { getNumPlayersFromLineupSettings } from "../League";
export const getCurrentPickInfo = (state, specificPick) => {
    const { settings, currentPick } = state;
    if (specificPick === undefined) {
        specificPick = currentPick;
    }
    const round = Math.floor(specificPick / settings.draftOrder.length);
    const pickInRound = specificPick % settings.draftOrder.length;
    console.log(round, pickInRound, specificPick);
    return {
        round,
        pickInRound,
    };
};
const createPickOrderWithTeams = (settings, teamsMap) => {
    const { draftOrder, pickOrder, numRounds } = settings;
    const reversedDraftOrder = draftOrder.slice().reverse();
    const numPicks = numRounds * draftOrder.length;
    const picks = {};
    let expandedPickOrder = [];
    for (let i = 0; i < numRounds; ++i) {
        picks[i] = new Array(draftOrder.length).fill(null);
        if (pickOrder === "snake" && i % 2 === 1) {
            expandedPickOrder.push(reversedDraftOrder.slice());
        }
        else {
            expandedPickOrder.push(draftOrder.slice());
        }
    }
    let curPick = 0;
    let curRound = 0;
    while (curPick < numPicks) {
        const pickInd = curRound === 0 ? curPick : curPick % draftOrder.length;
        const team = teamsMap[expandedPickOrder[curRound][pickInd]];
        picks[curRound][pickInd] = {
            pick: curPick,
            selectedBy: {
                owner: team.owner,
                ownerName: team.ownerName,
                name: team.name,
                id: team.id,
            },
            player: null,
        };
        curPick++;
        if (curPick % draftOrder.length === 0) {
            curRound++;
        }
    }
    return picks;
};
export const createDraftStateForLeague = (lineupSettings, leagueId, teams, availablePlayers, draftId, settings = null) => {
    if (!settings) {
        settings = {
            type: "official",
            draftId,
            numRounds: getNumPlayersFromLineupSettings(lineupSettings),
            pickOrder: "snake",
            draftOrder: teams.map((team) => team.id),
        };
    }
    return {
        settings,
        leagueId: leagueId,
        currentPick: 0,
        phase: "predraft",
        availablePlayers,
        selections: createPickOrderWithTeams(settings, mapTeamsToIds(teams)),
    };
};
//# sourceMappingURL=index.js.map