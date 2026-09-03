import { Team } from "@ff-mern/ff-types";
import { useMutation, useQueryClient } from "react-query";
import { apiPost } from "../../API/client";
import { queryKeys } from "./queryKeys";

export type UpdateTeamsResponse = {
  teams: Team[];
};

export const useUpdateTeamsMutation = (
  leagueId: string,
  teams: Team[],
  validate?: boolean
) => {
  const queryClient = useQueryClient();
  return useMutation<UpdateTeamsResponse, Error>(
    async () => {
      const path = validate
        ? `/api/v1/team/validateTeams/`
        : `/api/v1/team/updateTeams/`;
      return apiPost<UpdateTeamsResponse>(path, { teams });
    },
    {
      onSuccess: (data) => {
        queryClient.setQueryData(queryKeys.teams(leagueId), data);
        queryClient.invalidateQueries(queryKeys.teams(leagueId));
        queryClient.invalidateQueries(queryKeys.allTeams());
      },
    }
  );
};
