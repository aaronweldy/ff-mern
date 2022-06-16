import { Position } from "..";
import { ScoringSetting } from "..";
import { createEmptyPlayer, NflPlayer } from "../Player";

export type LineupSettings = Record<Position, number>;

export const getNumPlayersFromLineupSettings = (settings: LineupSettings) => {
  return Object.values(settings).reduce((acc, num) => acc + num, 0);
};

export const getEmptyLineupFromSettings = <T extends NflPlayer>(
  settings: LineupSettings,
  format: { createEmptyPlayer: () => T }
) => {
  const lineup = Object.keys(settings).reduce<Record<Position, T[]>>(
    (acc, pos: Position) => {
      acc[pos] = new Array<T>(settings[pos]).fill(format.createEmptyPlayer());
      return acc;
    },
    {} as Record<Position, T[]>
  );
  lineup["bench"] = [];
  return lineup;
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
