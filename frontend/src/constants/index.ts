import { Position } from "../ff-types/Position";

export const lineupOrder = {
  QB: 1,
  RB: 2,
  WR: 3,
  TE: 4,
  K: 5,
  "WR/RB": 6,
  "WR/RB/TE": 7,
  "QB/WR/RB/TE": 8,
  bench: 9,
};

export const lineupSorter = (a: Position, b: Position) =>
  lineupOrder[a] - lineupOrder[b];
