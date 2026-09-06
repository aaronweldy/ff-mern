import { useQuery } from "react-query";
import { apiGet } from "../../API/client";
import { queryKeys } from "./queryKeys";

type CumulativePlayerScoreYearsResponse = {
  years: number[];
};

const fetchCumulativePlayerScoreYears = (leagueId: string) =>
  apiGet<CumulativePlayerScoreYearsResponse>(
    "/api/v1/league/" +
      leagueId +
      "/cumulativePlayerScores/years/"
  );

export const useCumulativePlayerScoreYears = (leagueId: string) => {
  return useQuery<CumulativePlayerScoreYearsResponse, Error>(
    queryKeys.cumulativePlayerScoreYears(leagueId),
    () => fetchCumulativePlayerScoreYears(leagueId)
  );
};
