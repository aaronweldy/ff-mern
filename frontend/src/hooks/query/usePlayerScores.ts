import { PlayerScoresResponse } from "@ff-mern/ff-types";
import { useQuery } from "react-query";

const fetchPlayerScores = async (
  leagueId: string,
  week: number,
  players?: string[]
) => {
  const url = `${import.meta.env.VITE_PUBLIC_URL}/api/v1/league/${leagueId}/playerScores/`;
  const req = {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ players, week }),
  };
  const resp = await fetch(url, req);
  if (!resp.ok) {
    throw new Error(resp.statusText);
  }
  return await resp.json();
};

export const usePlayerScores = (
  leagueId: string,
  week: number,
  players?: string[]
) => {
  return useQuery<PlayerScoresResponse, Error>(
    ["playerScores", leagueId, week],
    () => fetchPlayerScores(leagueId, week, players)
  );
};
