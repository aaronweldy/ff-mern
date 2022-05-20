import { RosteredPlayer } from "../Player";
import { v4 } from "uuid";
import { getCurrentSeason } from "../Utils";

export type PlayerInTrade = {
  player: RosteredPlayer;
  fromTeam: string;
  toTeam: string;
};

export type TradeStatus = "pending" | "accepted" | "rejected" | "countered";

export type Trade = {
  id: string;
  season: number;
  // Proposer at index 0, receiver at index 1
  teamsInvolved: string[];
  players: PlayerInTrade[];
  status: TradeStatus;
  dateProposed: number;
  counterId: string | null;
};

export const buildTrade = (
  playersInvolved: Record<string, RosteredPlayer>[],
  teamIds: string[]
): Trade => {
  const players: PlayerInTrade[] = [];
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
