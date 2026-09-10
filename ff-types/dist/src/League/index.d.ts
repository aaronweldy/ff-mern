import { Position } from "..";
import { ScoringSetting } from "..";
import { createEmptyPlayer, NflPlayer } from "../Player";
export type LineupSettings = Record<Position, number>;
export declare const getNumPlayersFromLineupSettings: (settings: LineupSettings) => number;
export declare const getEmptyLineupFromSettings: <T extends NflPlayer>(settings: LineupSettings, format: {
    createEmptyPlayer: () => T;
}) => Record<Position, T[]>;
export declare class League {
    name: string;
    logo: string;
    commissioners: string[];
    scoringSettings: ScoringSetting[];
    lineupSettings: LineupSettings;
    lastScoredWeek: number;
    numWeeks: number;
    numSuperflex: number;
    constructor(name: string, commissioners: string[], numWeeks: number, lineupSettings: LineupSettings, logo: string);
}
