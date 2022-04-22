import { RosteredPlayer, Position, FinalizedPlayer } from "..";

export class Team {
  public id: string;
  public league: string;
  public leagueLogo: string;
  public logo: string;
  public owner: string;
  public rosteredPlayers: RosteredPlayer[];
  public weekInfo: TeamWeekInfo[];
  public lastUpdated: string;

  constructor(
    public name: string,
    public leagueName: string,
    public ownerName: string,
    public isCommissioner: boolean,
    numWeeks: number
  ) {
    this.lastUpdated = "";
    this.rosteredPlayers = [];
    this.logo = "/football.jfif";
    this.weekInfo = [
      ...Array(numWeeks + 1).fill({
        weekScore: 0,
        addedPoints: 0,
        finalizedLineup: {},
      }),
    ];
  }

  static updateNumWeeks(team: Team, numWeeks: number) {
    const newWeekInfo: TeamWeekInfo[] = [
      ...Array(numWeeks + 1).fill({
        weekScore: 0,
        addedPoints: 0,
        finalizedLineup: {},
      }),
    ];
    team.weekInfo.forEach((info, i) => {
      if (i <= numWeeks) {
        newWeekInfo[i] = info;
      }
    });
    team.weekInfo = newWeekInfo;
  }

  static sumWeekScore(team: Team, week: number) {
    if (week >= team.weekInfo.length) {
      return 0;
    }
    return team.weekInfo[week].addedPoints + team.weekInfo[week].weekScore;
  }
}

export type TeamWeekInfo = {
  weekScore: number;
  addedPoints: number;
  finalizedLineup: FinalizedLineup;
  isSuperflex: boolean;
};

export type FinalizedLineup = Record<Position, FinalizedPlayer[]>;

export const lineupToIterable = (lineup: FinalizedLineup) => {
  return Object.keys(lineup).reduce((acc: FinalizedPlayer[], pos) => {
    lineup[pos as Position].forEach((player) => {
      acc.push(player);
    });
    return acc;
  }, []);
};
