import { CumulativePlayerScores } from "@ff-mern/ff-types";
import { useQuery } from "react-query";
import { apiGet } from "../../API/client";
import { queryKeys } from "./queryKeys";

const fetchCumulativePlayerScores = (leagueId: string, year: number) =>
  apiGet<CumulativePlayerScores>(
    "/api/v1/league/" +
      leagueId +
      "/cumulativePlayerScores/?year=" +
      year
  );

export const useCumulativePlayerScores = (leagueId: string, year: number) => {
  return useQuery<CumulativePlayerScores, Error>(
    queryKeys.cumulativePlayerScores(leagueId, year),
    () => fetchCumulativePlayerScores(leagueId, year)
  );
};
