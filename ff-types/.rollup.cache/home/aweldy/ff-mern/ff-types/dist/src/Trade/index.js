import { v4 } from "uuid";
import { getCurrentSeason } from "../Utils";
export const buildTrade = (playersInvolved, teamIds) => {
    const players = [];
    playersInvolved.forEach((group, index) => {
        Object.values(group).forEach((player) => {
            players.push({
                player,
                fromTeam: teamIds[index],
                toTeam: teamIds[(index + 1) % 2],
            });
        });
    });
    return {
        id: v4(),
        season: getCurrentSeason(),
        teamsInvolved: teamIds,
        players,
        status: "pending",
        dateProposed: Date.now(),
        counterId: null,
    };
};
//# sourceMappingURL=index.js.map