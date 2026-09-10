import { sanitizePlayerName } from "../Utils";
export const setPlayerName = (player, name) => {
    player.fullName = name;
    player.sanitizedName = sanitizePlayerName(name);
};
export const createEmptyPlayer = () => ({
    fullName: "",
    sanitizedName: "",
    position: "QB",
    team: "None",
});
export class FinalizedPlayer {
    constructor(name, position, team, lineup) {
        this.createEmptyPlayer = () => {
            return new FinalizedPlayer("", "QB", "None", "bench");
        };
        this.fullName = name;
        this.sanitizedName = sanitizePlayerName(name);
        this.position = position;
        this.lineup = lineup;
        this.team = team;
    }
}
export class RosteredPlayer {
    constructor(name, team, pos) {
        this.fullName = name;
        this.sanitizedName = sanitizePlayerName(name);
        this.position = pos;
        this.team = team;
    }
}
RosteredPlayer.createEmptyPlayer = () => {
    return new FinalizedPlayer("", "QB", "None", "bench");
};
export class ProjectedPlayer {
}
ProjectedPlayer.createEmptyPlayer = () => ({
    fullName: "",
    sanitizedName: "",
    position: "QB",
    team: "None",
    byeWeek: "1",
    positionRank: "",
    overall: 500,
    average: 500,
});
export const positionTypes = [
    "QB",
    "RB",
    "WR",
    "TE",
    "K",
    "WR/RB",
    "WR/RB/TE",
    "QB/WR/RB/TE",
];
export const singlePositionTypes = [
    "QB",
    "RB",
    "WR",
    "TE",
    "K",
];
export const emptyDefaultPositions = positionTypes.reduce((map, pos) => {
    map[pos] = 0;
    return map;
}, {});
//# sourceMappingURL=index.js.map