import { AbbreviatedNflTeam, Week } from "..";
export declare const setPlayerName: (player: FinalizedPlayer | RosteredPlayer, name: string) => void;
export declare const createEmptyPlayer: () => NflPlayer;
export interface NflPlayer {
    fullName: string;
    sanitizedName: string;
    position: SinglePosition;
    team: AbbreviatedNflTeam | "None";
}
export declare class FinalizedPlayer implements NflPlayer {
    fullName: string;
    sanitizedName: string;
    position: SinglePosition;
    team: AbbreviatedNflTeam | "None";
    lineup: Position;
    backup: string;
    constructor(name: string, position: SinglePosition, team: AbbreviatedNflTeam | "None", lineup: Position);
    createEmptyPlayer: () => FinalizedPlayer;
}
export declare class RosteredPlayer implements NflPlayer {
    fullName: string;
    sanitizedName: string;
    position: SinglePosition;
    team: AbbreviatedNflTeam;
    constructor(name: string, team: AbbreviatedNflTeam, pos: SinglePosition);
    static createEmptyPlayer: () => FinalizedPlayer;
}
export declare class ProjectedPlayer implements NflPlayer {
    fullName: string;
    sanitizedName: string;
    position: SinglePosition;
    team: AbbreviatedNflTeam | "None";
    byeWeek: Week;
    positionRank: string;
    overall: number;
    average: number;
    static createEmptyPlayer: () => ProjectedPlayer;
}
export type SinglePosition = "QB" | "RB" | "WR" | "TE" | "K";
export type Position = "QB" | "RB" | "WR" | "TE" | "K" | "WR/RB" | "WR/RB/TE" | "QB/WR/RB/TE" | "bench";
export type PositionInfo = Record<Position, number>;
export declare const positionTypes: Position[];
export declare const singlePositionTypes: SinglePosition[];
export declare const emptyDefaultPositions: PositionInfo;
export type CumulativePlayerScore = {
    position: SinglePosition;
    totalPointsInSeason: number;
    pointsByWeek: number[];
    team: AbbreviatedNflTeam;
};
export type CumulativePlayerScores = Record<string, CumulativePlayerScore>;
