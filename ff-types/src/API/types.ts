import { Team, League, ScoringError } from "..";
import { DatabasePlayer } from "../..";

export type GenericRequest = {
  [key: string]: any;
};

export type LeagueAPIResponse = {
  teams: Team[];
  league: League;
};

export type StoredPlayerInformation = {
  statistics: DatabasePlayer;
  scoring: {
    totalPoints: number;
    categories: Record<string, number>;
  };
};

export type PlayerScoreData = {
  [key: string]: StoredPlayerInformation;
};

export type PlayerScoresResponse = {
  players: PlayerScoreData;
} & LeagueAPIResponse;

export type FetchPlayerScoresRequest = {
  leagueId: string;
  week: number;
  players?: string[];
};

export type RunScoresResponse = {
  teams: Team[];
  errors: ScoringError[];
  data: PlayerScoreData;
};
