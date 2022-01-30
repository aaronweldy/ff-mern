import { FinalizedPlayer } from "..";
import { Position } from "../Player";
import { Team } from "../Team";

export type ScoringCategory =
  | "ATT"
  | "CMP"
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

export type ErrorType = "NOT FOUND" | "POSSIBLE BACKUP";

export class ScoringError {
  public type: ErrorType;
  public desc: string;
  public player: FinalizedPlayer;
  public team: Team;

  constructor(
    type: ErrorType,
    desc: string,
    player: FinalizedPlayer,
    team: Team
  ) {
    this.type = type;
    this.desc = desc;
    this.player = player;
    this.team = team;
  }
}

export type StatKey =
  | "20+"
  | "ATT"
  | "CMP"
  | "Y/CMP"
  | "FL"
  | "FPTS"
  | "FPTS/G"
  | "G"
  | "LG"
  | "Player"
  | "REC"
  | "ROST"
  | "Rank"
  | "TD"
  | "TD_2"
  | "TGT"
  | "Y/R"
  | "YDS"
  | "YDS_2"
  | "ATT_2"
  | "Y/A"
  | "PCT"
  | "INT"
  | "1-19"
  | "20-29"
  | "30-39"
  | "40-49"
  | "50+"
  | "XPT";

export type DatabasePlayer = Record<StatKey, string>;
