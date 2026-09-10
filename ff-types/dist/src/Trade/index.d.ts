import { RosteredPlayer } from "../Player";
export type PlayerInTrade = {
    player: RosteredPlayer;
    fromTeam: string;
    toTeam: string;
};
export type TradeStatus = "pending" | "accepted" | "rejected" | "countered";
export type Trade = {
    id: string;
    season: number;
    teamsInvolved: string[];
    players: PlayerInTrade[];
    status: TradeStatus;
    dateProposed: number;
    counterId: string | null;
};
export declare const buildTrade: (playersInvolved: Record<string, RosteredPlayer>[], teamIds: string[]) => Trade;
