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

export class League {
  public name: string;
  public logo: string;
  public commissioners: string[];
  public scoringSettings: ScoringSetting[];
  public lineupSettings: Record<Position, number>;
  public lastScoredWeek: number;
  public numWeeks: number;

  constructor(name: string, commissioners: string[], numWeeks: number) {
    this.name = name;
    this.commissioners = commissioners;
    this.numWeeks = numWeeks;
  }
}

export class Team {
  public name: string;
  public id: string;
  public league: string;
  public leagueLogo: string;
  public leagueName: string;
  public logo: string;
  public owner: string;
  public ownerName: string;
  public addedPoints: number[];
  public isCommissioner: boolean;
  public weekScores: number[];
  public players: LocalPlayer[];

  constructor(
    name: string,
    league: string,
    ownerName: string,
    isCommissioner: boolean
  ) {
    this.ownerName = ownerName;
    this.name = name;
    this.league = league;
    this.isCommissioner = isCommissioner;
  }
}

export class LocalPlayer {
  public name: string;
  public position: SinglePosition;
  public points: number[];
  public backup: string[];
  public lineup: Position[];
  public weekStats: Array<Record<string, number>>;
  public error: boolean;
  public dummyPlayer: boolean;

  constructor(
    name: string,
    position: SinglePosition,
    lineup: Position,
    numWeeks: number,
    dummy: boolean
  ) {
    this.name = name;
    this.position = position;
    this.points = Array<number>(numWeeks).fill(0);
    this.backup = Array<string>(numWeeks).fill("");
    this.lineup = Array<Position>(numWeeks).fill(lineup);
    this.weekStats = Array<Record<string, number>>(numWeeks).fill({});
    this.dummyPlayer = dummy;
  }
}

export type ErrorType = "NOT FOUND" | "POSSIBLE BACKUP";

export class ScoringError {
  public type: ErrorType;
  public desc: string;
  public player: LocalPlayer;
  public team: Team;

  constructor(type: ErrorType, desc: string, player: LocalPlayer, team: Team) {
    this.type = type;
    this.desc = desc;
    this.player = player;
    this.team = team;
  }
}
