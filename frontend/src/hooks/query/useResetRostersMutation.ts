import { Team } from "@ff-mern/ff-types";
import { useMutation, useQueryClient } from "react-query";

export const useResetRostersMutation = (leagueId: string) => {
  const queryClient = useQueryClient();
  return useMutation<Team[], Error>(
    async () => {
      const url = `${import.meta.env.VITE_PUBLIC_URL}/api/v1/league/${leagueId}/resetAllRosters/`;
      const req = {
        method: "PATCH",
        headers: { "content-type": "application/json" },
      };
      const data = await fetch(url, req);
      if (!data.ok) {
        throw new Error(data.statusText);
      }
      const { teams } = await data.json();
      return teams as Team[];
    },
    {
      onSuccess: (data) => {
        queryClient.setQueryData(["teams", leagueId], { teams: data });
      },
    }
  );
};
