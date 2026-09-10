import { RosteredPlayer, Position, FinalizedPlayer } from "..";
import { NflPlayer } from "../Player";
export type TeamRoster = Record<Position, NflPlayer[]>;
export type SimplifiedTeamInfo = {
    owner: string;
    ownerName: string;
    name: string;
    id: string;
};
export declare class Team {
    name: string;
    leagueName: string;
    ownerName: string;
    isCommissioner: boolean;
    id: string;
    league: string;
    leagueLogo: string;
    logo: string;
    owner: string;
    rosteredPlayers: RosteredPlayer[];
    weekInfo: TeamWeekInfo[];
    lastUpdated: string;
    constructor(name: string, leagueName: string, ownerName: string, isCommissioner: boolean, numWeeks: number);
    static updateNumWeeks(team: Team, numWeeks: number): void;
    static sumWeekScore(team: Team, week: number): number;
    static generateSimplifiedInfo(team: Team): SimplifiedTeamInfo;
}
export type TeamWeekInfo = {
    weekScore: number;
    addedPoints: number;
    finalizedLineup: FinalizedLineup;
    isSuperflex: boolean;
};
export type FinalizedLineup<T = void> = T extends void ? Record<Position, FinalizedPlayer[]> : Record<Extract<Position, keyof T>, FinalizedPlayer[]>;
export type IterablePlayer = NflPlayer & {
    lineup: Position;
};
export declare const lineupToIterable: (lineup: TeamRoster) => IterablePlayer[];
export declare const mapTeamsToIds: (teams: Team[]) => Record<string, Team>;
