import { League, ScoringSetting } from "@ff-mern/ff-types";
import { useMutation, useQueryClient } from "react-query";
import { apiPatch } from "../../API/client";
import { queryKeys } from "./queryKeys";

export const useLeagueSettingsMutation = (id: string) => {
  const queryClient = useQueryClient();
  const { mutate, isLoading, isError } = useMutation<
    League,
    Error,
    ScoringSetting[]
  >(
    async (settings) => {
      const { league } = await apiPatch<{ league: League }>(
        `/api/v1/league/${id}/updateScoringSettings/`,
        { id, settings }
      );
      return league;
    },
    {
      onSuccess: (data) => {
        queryClient.setQueryData(queryKeys.league(id), { league: data });
        queryClient.invalidateQueries(queryKeys.league(id));
      },
    }
  );
  return { mutate, isLoading, isError };
};
