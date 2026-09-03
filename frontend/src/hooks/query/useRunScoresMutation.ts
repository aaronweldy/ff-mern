import { RunScoresResponse, Team } from "@ff-mern/ff-types";
import { useMutation, useQueryClient } from "react-query";
import { apiPost } from "../../API/client";
import { queryKeys } from "./queryKeys";

export const useRunScoresMutation = (
  id: string,
  week: number,
  teams: Team[]
) => {
  const queryClient = useQueryClient();
  return useMutation<RunScoresResponse, Error>(
    "runScores",
    async () =>
      apiPost<RunScoresResponse>(`/api/v1/league/${id}/runScores/`, {
        id,
        week,
        teams,
      }),
    {
      onSuccess: (data) => {
        queryClient.setQueryData(queryKeys.teams(id), { teams: data.teams });
        queryClient.setQueryData(queryKeys.playerScores(id, week), {
          teams: data.teams,
          players: data.data,
        });
        queryClient.invalidateQueries(queryKeys.teams(id));
        queryClient.invalidateQueries(queryKeys.playerScores(id, week));
        queryClient.invalidateQueries(queryKeys.allTeams());
      },
    }
  );
};
