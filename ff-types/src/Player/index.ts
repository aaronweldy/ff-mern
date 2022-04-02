import { AbbreviatedNflTeam } from "..";

export class FinalizedPlayer {
  name: string;
  position: SinglePosition;
  team: AbbreviatedNflTeam | "";
  lineup: Position;
  backup: string;

  constructor(
    name: string,
    position: SinglePosition,
    team: AbbreviatedNflTeam | "",
    lineup: Position
  ) {
    this.name = name;
    this.position = position;
    this.lineup = lineup;
    this.team = team;
  }
}

export class RosteredPlayer {
  name: string;
  position: SinglePosition;
  team: AbbreviatedNflTeam;

  constructor(name: string, team: AbbreviatedNflTeam, pos: SinglePosition) {
    this.name = name;
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
};

export type CumulativePlayerScores = Record<string, CumulativePlayerScore>;
