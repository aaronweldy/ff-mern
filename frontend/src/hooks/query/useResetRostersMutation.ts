import { Team } from "@ff-mern/ff-types";
import { useMutation, useQueryClient } from "react-query";
import { apiPatch } from "../../API/client";
import { queryKeys } from "./queryKeys";

export const useResetRostersMutation = (leagueId: string) => {
  const queryClient = useQueryClient();
  return useMutation<Team[], Error>(
    async () => {
      const { teams } = await apiPatch<{ teams: Team[] }>(
        `/api/v1/league/${leagueId}/resetAllRosters/`
      );
      return teams;
    },
    {
      onSuccess: (data) => {
        queryClient.setQueryData(queryKeys.teams(leagueId), { teams: data });
        queryClient.invalidateQueries(queryKeys.teams(leagueId));
        queryClient.invalidateQueries(queryKeys.allTeams());
      },
    }
  );
};
