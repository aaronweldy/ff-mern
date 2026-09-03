import {
  CumulativePlayerScores,
  FetchPlayerScoresRequest,
  LeagueAPIResponse,
  PlayerScoresResponse,
  RosteredPlayer,
  RunScoresResponse,
  Team,
  TeamFantasyPositionPerformance,
  TeamToSchedule,
} from "@ff-mern/ff-types";
import { apiGet, apiPost } from "./client";

export class API {
  static fetchLeague(leagueId: string) {
    return apiGet<LeagueAPIResponse>(`/api/v1/league/${leagueId}/`);
  }

  static runScores(id: string, week: number = 1, teams: Team[]) {
    return apiPost<RunScoresResponse>(`/api/v1/league/${id}/runScores/`, {
      week,
      teams,
    });
  }

  static fetchPlayerScores({
    leagueId,
    week,
    players,
  }: FetchPlayerScoresRequest) {
    return apiPost<PlayerScoresResponse>(
      `/api/v1/league/${leagueId}/playerScores/`,
      { players, week }
    );
  }

  static validateAndUpdateTeams(teams: Team[]) {}

  static async updateTeams(teams: Team[]) {
    const json = await apiPost<{ teams: Team[] }>(`/api/v1/team/updateTeams/`, {
      teams,
    });
    return json.teams;
  }

  static async fetchGlobalPlayers() {
    const json = await apiGet<{ players: RosteredPlayer[] }>(
      "/api/v1/nflData/allPlayers/"
    );
    return json.players;
  }

  static async fetchNflSchedule() {
    const json = await apiGet<{ schedule: TeamToSchedule }>(
      "/api/v1/nflData/nflSchedule/"
    );
    return json.schedule;
  }

  static async fetchNflDefenseStats() {
    const json = await apiGet<{ data: TeamFantasyPositionPerformance }>(
      "/api/v1/nflData/nflDefenseStats/"
    );
    return json.data;
  }

  static fetchCumulativePlayerScores(leagueId: string) {
    return apiGet<CumulativePlayerScores>(
      `/api/v1/league/${leagueId}/cumulativePlayerScores/`
    );
  }
}
