import { RunScoresResponse, Team } from "@ff-mern/ff-types";
import { useMutation, useQueryClient } from "react-query";

export const useRunScoresMutation = (
  id: string,
  week: number,
  teams: Team[]
) => {
  const queryClient = useQueryClient();
  return useMutation<RunScoresResponse, Error>(
    "runScores",
    async () => {
      const url = `${import.meta.env.VITE_PUBLIC_URL}/api/v1/league/${id}/runScores/`;
      const req = {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, week, teams }),
      };
      const resp = await fetch(url, req);
      if (!resp.ok) {
        throw new Error(resp.statusText);
      }
      return resp.json();
    },
    {
      onSuccess: (data) => {
        queryClient.setQueryData(["teams", id], { teams: data.teams });
        queryClient.setQueryData(["playerScores", id, week], {
          teams: data.teams,
          players: data.data,
        });
        queryClient.invalidateQueries(["team"]);
      },
    }
  );
};
