import { RosteredPlayer, Position, FinalizedPlayer, lineupSorter } from "..";
import { NflPlayer } from "../Player";
import { lineupOrder } from "../Utils";

export type TeamRoster = Record<Position, NflPlayer[]>;

// Commonly used team information to save space.
export type SimplifiedTeamInfo = {
  owner: string;
  ownerName: string;
  name: string;
  id: string;
};

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

  static generateSimplifiedInfo(team: Team): SimplifiedTeamInfo {
    return {
      owner: team.owner,
      ownerName: team.ownerName,
      name: team.name,
      id: team.id,
    };
  }
}

export type TeamWeekInfo = {
  weekScore: number;
  addedPoints: number;
  finalizedLineup: FinalizedLineup;
  isSuperflex: boolean;
};

export type FinalizedLineup<T = void> = T extends void
  ? Record<Position, FinalizedPlayer[]>
  : Record<Extract<Position, keyof T>, FinalizedPlayer[]>;

export type IterablePlayer = NflPlayer & { lineup: Position };

export const lineupToIterable = (lineup: TeamRoster) => {
  return Object.keys(lineup)
    .reduce<IterablePlayer[]>((acc, pos) => {
      lineup[pos as Position].forEach((player) => {
        const itPlayer = {
          ...player,
          lineup: pos as Position,
        };
        acc.push(itPlayer);
      });
      return acc;
    }, [])
    .sort((a, b) => lineupOrder[a.lineup] - lineupOrder[b.lineup]);
};

export const mapTeamsToIds = (teams: Team[]) => {
  return teams.reduce((acc: Record<string, Team>, team) => {
    acc[team.id] = team;
    return acc;
  }, {});
};
