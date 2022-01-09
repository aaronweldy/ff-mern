import { LocalPlayer } from "./LocalPlayer";

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
    isCommissioner: boolean,
    numWeeks: number
  ) {
    this.ownerName = ownerName;
    this.name = name;
    this.leagueName = league;
    this.isCommissioner = isCommissioner;
    this.addedPoints = [...Array(numWeeks + 1).fill(0)];
    this.weekScores = [...Array(numWeeks + 1).fill(0)];
    this.players = [];
    this.logo = "/football.jfif";
  }

  updateNumWeeks(numWeeks: number) {
    this.addedPoints = [...Array(numWeeks + 1).fill(0)];
    this.weekScores = [...Array(numWeeks + 1).fill(0)];
  }
}
