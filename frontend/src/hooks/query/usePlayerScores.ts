import { PlayerScoresResponse } from "@ff-mern/ff-types";
import { useQuery } from "react-query";
import { apiPost } from "../../API/client";
import { queryKeys } from "./queryKeys";

const fetchPlayerScores = (leagueId: string, week: number, players?: string[]) =>
  apiPost<PlayerScoresResponse>(`/api/v1/league/${leagueId}/playerScores/`, {
    players,
    week,
  });

export const usePlayerScores = (
  leagueId: string,
  week: number,
  players?: string[]
) => {
  return useQuery<PlayerScoresResponse, Error>(
    queryKeys.playerScores(leagueId, week),
    () => fetchPlayerScores(leagueId, week, players)
  );
};
