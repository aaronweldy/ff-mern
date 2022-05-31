import { AbbreviatedNflTeam } from "..";
import { sanitizePlayerName } from "../Utils";

export const setPlayerName = (
  player: FinalizedPlayer | RosteredPlayer,
  name: string
) => {
  player.fullName = name;
  player.sanitizedName = sanitizePlayerName(name);
};

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
