import { Team } from "@ff-mern/ff-types";
import { useMutation, useQueryClient } from "react-query";
import { UpdateTeamsResponse } from "./useUpdateTeamsMutation";

export const useUpdateSingleTeamMutation = (teamId: string) => {
  const queryClient = useQueryClient();
  return useMutation<UpdateTeamsResponse, Error, Team>(
    async (team: Team) => {
      const url = `${process.env.REACT_APP_PUBLIC_URL}/api/v1/team/updateTeams/`;
      const body = JSON.stringify({ teams: [team] });
      const req = {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
      };
      const resp = await fetch(url, req);
      if (!resp.ok) {
        throw new Error(resp.statusText);
      }
      return resp.json();
    },
    {
      onSuccess: (data) => {
        console.log(data);
        queryClient.setQueryData(["team", teamId], { team: data.teams[0] });
      },
    }
  );
};
