import { Team, League, ScoringError, Week } from "..";
import {
  AbbreviatedNflTeam,
  DatabasePlayer,
  FullNflTeam,
  SinglePosition,
} from "..";
import { LineupSettings } from "../League";
import { NflPlayer, RosteredPlayer } from "../Player";

export type GenericRequest = {
  [key: string]: any;
};

export type LeagueAPIResponse = {
  teams: Team[];
  league: League;
};

export type StoredPlayerInformation = {
  team: AbbreviatedNflTeam;
  position: SinglePosition;
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

export type FantasyPerformanceByPosition = Record<SinglePosition, number>;

export type TeamFantasyPositionPerformance = Record<
  FullNflTeam,
  FantasyPerformanceByPosition
>;

export type TeamToSchedule = Record<
  FullNflTeam,
  Record<Week, AbbreviatedNflTeam | "BYE">
>;

export type ScrapedPlayerProjection = {
  Player: string;
  FPTS: string;
};

export type SingleTeamResponse = {
  team: Team;
};

export type QuicksetRequest = {
  week: Week;
  type: QuicksetLineupType;
  lineupSettings: LineupSettings;
};
export type QuicksetLineupType = "LastWeek" | "Projection";

export type UpdateAllTeamsResponse = {
  teams: Team[];
};

export type ScrapedADPData = {
  Overall: string;
  "Player Team (Bye)": string;
  AVG: string;
  QB?: string;
  RB?: string;
  WR?: string;
  TE?: string;
  K?: string;
};

export class ProjectedPlayer implements NflPlayer {
  fullName: string;
  sanitizedName: string;
  position: SinglePosition;
  team: AbbreviatedNflTeam | "None";
  byeWeek: Week;
  positionRank: string;
  overall: number;
  average: number;
}
