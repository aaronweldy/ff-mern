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
