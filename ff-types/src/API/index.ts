import { Team } from "..";
import {
  FetchPlayerScoresRequest,
  GenericRequest,
  LeagueAPIResponse,
  PlayerScoresResponse,
  RunScoresResponse,
} from "./types";

const generatePostRequest = (body: GenericRequest) => {
  return {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
};

const toJSON = (data: Response) => data.json();

export class API {
  static serverAddress = "";

  static fetchLeague(leagueId: string) {
    const url = this.serverAddress + `/api/v1/league/${leagueId}/`;
    return new Promise<LeagueAPIResponse>((resolve, _) => {
      fetch(url)
        .then((data) => data.json())
        .then((json) => resolve(json));
    });
  }

  static runScores(id: string, week: number = 1, teams: Team[]) {
    const url = this.serverAddress + `/api/v1/league/${id}/runScores/`;
    const reqDict = generatePostRequest({ week, teams });
    return new Promise<RunScoresResponse>((resolve, _) => {
      fetch(url, reqDict)
        .then(toJSON)
        .then((json) => resolve(json));
    });
  }

  static fetchPlayerScores({
    leagueId,
    week,
    players,
  }: FetchPlayerScoresRequest) {
    const url = this.serverAddress + `/api/v1/league/${leagueId}/playerScores/`;
    const req = generatePostRequest({ players, week });
    return new Promise<PlayerScoresResponse>((resolve, reject) =>
      fetch(url, req)
        .then(toJSON)
        .then((json) => resolve(json))
        .catch((err) => reject(err))
    );
  }

  static updateTeams(teams: Team[]) {
    const url = this.serverAddress + `/api/v1/league/updateTeams/`;
    const req = generatePostRequest({ teams });
    return new Promise<Team[]>((resolve, _) =>
      fetch(url, req)
        .then(toJSON)
        .then((json) => resolve(json.teams))
    );
  }
}
