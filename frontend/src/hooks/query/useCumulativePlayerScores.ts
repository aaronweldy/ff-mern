import { CumulativePlayerScores } from "@ff-mern/ff-types";
import { useQuery } from "react-query";
import { apiGet } from "../../API/client";
import { queryKeys } from "./queryKeys";

const fetchCumulativePlayerScores = (leagueId: string) =>
  apiGet<CumulativePlayerScores>(
    `/api/v1/league/${leagueId}/cumulativePlayerScores/`
  );

export const useCumulativePlayerScores = (leagueId: string) => {
  return useQuery<CumulativePlayerScores, Error>(
    queryKeys.cumulativePlayerScores(leagueId),
    () => fetchCumulativePlayerScores(leagueId)
  );
};
