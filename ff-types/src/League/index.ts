import { Position } from "..";
import { ScoringSetting } from "..";

export type LineupSettings = Record<Position, number>;

export const getNumPlayersFromLineupSettings = (settings: LineupSettings) => {
  return Object.values(settings).reduce((acc, num) => acc + num, 0);
};

export class League {
  public name: string;
  public logo: string;
  public commissioners: string[];
  public scoringSettings: ScoringSetting[];
  public lineupSettings: LineupSettings;
  public lastScoredWeek: number;
  public numWeeks: number;
  public numSuperflex: number;

  constructor(
    name: string,
    commissioners: string[],
    numWeeks: number,
    lineupSettings: LineupSettings,
    logo: string
  ) {
    this.name = name;
    this.commissioners = commissioners;
    this.numWeeks = numWeeks;
    this.lastScoredWeek = 0;
    this.numSuperflex = 0;
    this.lineupSettings = lineupSettings;
    this.logo = logo;
  }
}
