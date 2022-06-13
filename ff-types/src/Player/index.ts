import { AbbreviatedNflTeam, Week } from "..";
import { sanitizePlayerName } from "../Utils";

export const setPlayerName = (
  player: FinalizedPlayer | RosteredPlayer,
  name: string
) => {
  player.fullName = name;
  player.sanitizedName = sanitizePlayerName(name);
};

export const createEmptyPlayer = (): NflPlayer => ({
  fullName: "",
  sanitizedName: "",
  position: "QB",
  team: "None",
});

export interface NflPlayer {
  // Used in most places -- correctly capitalized version of name.
  fullName: string;
  // Used to index into data structures with capitalization/periods removed.
  sanitizedName: string;
  position: SinglePosition;
  team: AbbreviatedNflTeam | "None";
}

export class FinalizedPlayer implements NflPlayer {
  fullName: string;
  sanitizedName: string;
  position: SinglePosition;
  team: AbbreviatedNflTeam | "None";
  lineup: Position;
  backup: string;

  constructor(
    name: string,
    position: SinglePosition,
    team: AbbreviatedNflTeam | "None",
    lineup: Position
  ) {
    this.fullName = name;
    this.sanitizedName = sanitizePlayerName(name);
    this.position = position;
    this.lineup = lineup;
    this.team = team;
  }

  createEmptyPlayer = () => {
    return new FinalizedPlayer("", "QB", "None", "bench");
  };
}

export class RosteredPlayer implements NflPlayer {
  fullName: string;
  sanitizedName: string;
  position: SinglePosition;
  team: AbbreviatedNflTeam;

  constructor(name: string, team: AbbreviatedNflTeam, pos: SinglePosition) {
    this.fullName = name;
    this.sanitizedName = sanitizePlayerName(name);
    this.position = pos;
    this.team = team;
  }

  static createEmptyPlayer = () => {
    return new FinalizedPlayer("", "QB", "None", "bench");
  };
}

export class ProjectedPlayer implements NflPlayer {
  fullName: string;
  sanitizedName: string;
  position: SinglePosition;
  team: AbbreviatedNflTeam | "None";
  byeWeek: Week;
  positionRank: string;
  overall: number;
  average: number;

  static createEmptyPlayer = (): ProjectedPlayer => ({
    fullName: "",
    sanitizedName: "",
    position: "QB",
    team: "None",
    byeWeek: "1",
    positionRank: "",
    overall: 500,
    average: 500,
  });
}

export type SinglePosition = "QB" | "RB" | "WR" | "TE" | "K";

export type Position =
  | "QB"
  | "RB"
  | "WR"
  | "TE"
  | "K"
  | "WR/RB"
  | "WR/RB/TE"
  | "QB/WR/RB/TE"
  | "bench";

export type PositionInfo = Record<Position, number>;

export const positionTypes: Position[] = [
  "QB",
  "RB",
  "WR",
  "TE",
  "K",
  "WR/RB",
  "WR/RB/TE",
  "QB/WR/RB/TE",
];

export const singlePositionTypes: SinglePosition[] = [
  "QB",
  "RB",
  "WR",
  "TE",
  "K",
];

export const emptyDefaultPositions = positionTypes.reduce(
  (map: Partial<PositionInfo>, pos) => {
    map[pos] = 0;
    return map;
  },
  {}
) as PositionInfo;

export type CumulativePlayerScore = {
  position: SinglePosition;
  totalPointsInSeason: number;
  pointsByWeek: number[];
  team: AbbreviatedNflTeam;
};

export type CumulativePlayerScores = Record<string, CumulativePlayerScore>;
