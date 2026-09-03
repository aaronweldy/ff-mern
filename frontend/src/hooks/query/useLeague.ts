import { League } from "@ff-mern/ff-types";
import { useQuery, useQueryClient } from "react-query";
import { apiGet } from "../../API/client";
import { queryKeys } from "./queryKeys";

type ApiResponse = {
  league: League;
};

const getLeagueData = (id: string) =>
  apiGet<ApiResponse>(`/api/v1/league/${id}/`);

export const useLeague = (id: string) => {
  const queryClient = useQueryClient();
  const { data, isLoading, isSuccess, ...rest } = useQuery(
    queryKeys.league(id),
    () => getLeagueData(id)
  );
  const league = data?.league;
  // Optimistic-UI helper kept for callers that edit league fields locally
  // before a mutation. Reads should prefer `league` (the cache) directly.
  const setLeague = (
    update: League | undefined | ((prev: League | undefined) => League | undefined)
  ) => {
    queryClient.setQueryData<ApiResponse | undefined>(
      queryKeys.league(id),
      (prev) => {
        const next =
          typeof update === "function"
            ? (update as (p: League | undefined) => League | undefined)(prev?.league)
            : update;
        if (next === undefined) return prev;
        return { league: next };
      }
    );
  };
  return { league, setLeague, isLoading, isSuccess, ...rest };
};
