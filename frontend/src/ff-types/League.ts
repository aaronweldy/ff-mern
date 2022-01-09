import { Position } from "./Position";
import { ScoringSetting } from "./Scoring";

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
