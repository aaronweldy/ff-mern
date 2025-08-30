import {
  CumulativePlayerScores,
  FetchPlayerScoresRequest,
  GenericRequest,
  LeagueAPIResponse,
  PlayerScoresResponse,
  RosteredPlayer,
  RunScoresResponse,
  Team,
  TeamFantasyPositionPerformance,
  TeamToSchedule,
} from "@ff-mern/ff-types";

const generatePostRequest = (body: GenericRequest) => {
  return {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
};

const toJSON = (data: Response) => data.json();

export class API {
  static fetchLeague(leagueId: string) {
    const url =
      import.meta.env.VITE_PUBLIC_URL + `/api/v1/league/${leagueId}/`;
    return new Promise<LeagueAPIResponse>((resolve, _) => {
      fetch(url)
        .then((data) => data.json())
        .then((json) => resolve(json));
    });
  }

  static runScores(id: string, week: number = 1, teams: Team[]) {
    const url =
      import.meta.env.VITE_PUBLIC_URL + `/api/v1/league/${id}/runScores/`;
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
    const url =
      import.meta.env.VITE_PUBLIC_URL +
      `/api/v1/league/${leagueId}/playerScores/`;
    const req = generatePostRequest({ players, week });
    return new Promise<PlayerScoresResponse>((resolve, reject) =>
      fetch(url, req)
        .then(toJSON)
        .then((json) => resolve(json))
        .catch((err) => reject(err))
    );
  }

  static validateAndUpdateTeams(teams: Team[]) { }

  static updateTeams(teams: Team[]) {
    const url = import.meta.env.VITE_PUBLIC_URL + `/api/v1/team/updateTeams/`;
    const req = generatePostRequest({ teams });
    return new Promise<Team[]>((resolve, _) =>
      fetch(url, req)
        .then(toJSON)
        .then((json) => resolve(json.teams))
    );
  }

  static fetchGlobalPlayers() {
    const url =
      import.meta.env.VITE_PUBLIC_URL + "/api/v1/nflData/allPlayers/";
    return new Promise<RosteredPlayer[]>((resolve, reject) => {
      fetch(url)
        .then((data) => data.json())
        .then((json: { players: RosteredPlayer[] }) => resolve(json.players))
        .catch((err) => reject(err));
    });
  }

  static fetchNflSchedule() {
    const url =
      import.meta.env.VITE_PUBLIC_URL + "/api/v1/nflData/nflSchedule/";
    return new Promise<TeamToSchedule>((resolve, reject) => {
      fetch(url)
        .then((data) => data.json())
        .then((json: { schedule: TeamToSchedule }) => resolve(json.schedule))
        .catch((err) => reject(err));
    });
  }

  static fetchNflDefenseStats() {
    const url =
      import.meta.env.VITE_PUBLIC_URL + "/api/v1/nflData/nflDefenseStats/";
    return new Promise<TeamFantasyPositionPerformance>((resolve, reject) => {
      fetch(url)
        .then((data) => data.json())
        .then((json: { data: TeamFantasyPositionPerformance }) =>
          resolve(json.data)
        )
        .catch((err) => reject(err));
    });
  }

  static fetchCumulativePlayerScores(leagueId: string) {
    const url =
      import.meta.env.VITE_PUBLIC_URL +
      `/api/v1/league/${leagueId}/cumulativePlayerScores/`;
    return new Promise<CumulativePlayerScores>((resolve, reject) => {
      fetch(url)
        .then((data) => data.json())
        .then((json: CumulativePlayerScores) => resolve(json))
        .catch((err) => reject(err));
    });
  }
}
