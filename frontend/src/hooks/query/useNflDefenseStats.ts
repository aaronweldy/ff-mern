import { TeamFantasyPositionPerformance } from "@ff-mern/ff-types";
import { useQuery } from "react-query";
import { apiGet } from "../../API/client";
import { queryKeys } from "./queryKeys";

const fetchDefenseStats = () =>
  apiGet<{ data: TeamFantasyPositionPerformance }>(
    "/api/v1/nflData/nflDefenseStats/"
  );

type NflDefenseStatsResponse = {
  data: TeamFantasyPositionPerformance;
};

export const useNflDefenseStats = () => {
  return useQuery<NflDefenseStatsResponse, Error>(
    queryKeys.nflDefenseStats(),
    fetchDefenseStats
  );
};
