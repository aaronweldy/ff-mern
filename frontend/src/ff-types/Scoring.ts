import { Position } from "./Position";

export type ScoringCategory =
  | "ATT"
  | "PASS YD"
  | "REC YD"
  | "RUSH YD"
  | "CARRIES"
  | "YD PER CARRY"
  | "YD PER CATCH"
  | "REC"
  | "TARGETS"
  | "PASS TD"
  | "RUSH TD"
  | "REC TD"
  | "YD PER ATT"
  | "YD PER COMPLETION"
  | "CP%"
  | "INT"
  | "FUM"
  | "XPT"
  | "FG 1-19"
  | "FG 20-29"
  | "FG 30-39"
  | "FG 40-49"
  | "FG 50+"
  | "FG/XP MISS";

export type Qualifier = "per" | "between" | "greater than" | "test";

export type ScoringMinimum = {
  statType: ScoringCategory;
  threshold: number;
};

export type FullCategory = {
  qualifier: Qualifier;
  statType: ScoringCategory;
  threshold: number;
  thresholdMin?: number;
  thresholdMax?: number;
};

export type ScoringSetting = {
  category: FullCategory;
  minimums: ScoringMinimum[];
  points: number;
  position: Position;
};
