export class FinalizedPlayer {
  name: string;
  position: SinglePosition;
  lineup: Position;
  backup: string;

  constructor(name: string, position: SinglePosition, lineup: Position) {
    this.name = name;
    this.position = position;
    this.lineup = lineup;
  }
}

export class RosteredPlayer {
  name: string;
  position: SinglePosition;

  constructor(name: string, pos: SinglePosition) {
    this.name = name;
    this.position = pos;
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
