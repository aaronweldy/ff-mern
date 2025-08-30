import { CumulativePlayerScores } from "@ff-mern/ff-types";
import { useQuery } from "react-query";

const fetchCumulativePlayerScores = async (leagueId: string) => {
  const url =
    import.meta.env.VITE_PUBLIC_URL +
    `/api/v1/league/${leagueId}/cumulativePlayerScores/`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(resp.statusText);
  }
  return (await resp.json()) as CumulativePlayerScores;
};

export const useCumulativePlayerScores = (leagueId: string) => {
  return useQuery<CumulativePlayerScores, Error>(
    ["cumulativePlayerScores", leagueId],
    () => fetchCumulativePlayerScores(leagueId)
  );
};
