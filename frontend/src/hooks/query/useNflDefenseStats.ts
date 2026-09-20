import { ScoringSetting, TeamFantasyPositionPerformance } from "@ff-mern/ff-types";
import { useQuery } from "react-query";
import { apiGet } from "../../API/client";
import { queryKeys } from "./queryKeys";

export type DefenseStatsMetadata = {
  source: string;
  season: number;
  throughWeek: number;
  fetchedAt: string;
  stale: boolean;
  gamesPlayed: Record<string, number>;
};

type NflDefenseStatsResponse = {
  data: TeamFantasyPositionPerformance;
  metadata?: DefenseStatsMetadata;
};

export const useNflDefenseStats = (leagueId?: string, settings?: ScoringSetting[]) => {
  return useQuery<NflDefenseStatsResponse, Error>(
    [...queryKeys.nflDefenseStats(leagueId), settings],
    () => apiGet<NflDefenseStatsResponse>(
      `/api/v1/nflData/nflDefenseStats/${leagueId ? `?leagueId=${encodeURIComponent(leagueId)}` : ""}`
    ),
    { enabled: !leagueId || !!settings, staleTime: 60_000, refetchInterval: 5 * 60_000 }
  );
};
