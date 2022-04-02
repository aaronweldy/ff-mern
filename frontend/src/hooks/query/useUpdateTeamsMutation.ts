import { Team } from "@ff-mern/ff-types";
import { useMutation, useQueryClient } from "react-query";

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
      const url =
        `${process.env.REACT_APP_PUBLIC_URL}/api/v1/team/` + validate
          ? "validateTeams/"
          : "updateTeams/";
      const body = JSON.stringify({ teams });
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
        queryClient.setQueryData(["teams", leagueId], data);
      },
    }
  );
};
