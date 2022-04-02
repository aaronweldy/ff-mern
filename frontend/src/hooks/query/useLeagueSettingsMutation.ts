import { League, ScoringSetting } from "@ff-mern/ff-types";
import { useMutation, useQueryClient } from "react-query";

// Send a patch request to update the league scoring settings.
export const useLeagueSettingsMutation = (id: string) => {
  const queryClient = useQueryClient();
  const { mutate, isLoading, isError } = useMutation<
    League,
    Error,
    ScoringSetting[]
  >(
    async (settings) => {
      const url = `${process.env.REACT_APP_PUBLIC_URL}/api/v1/league/${id}/updateScoringSettings/`;
      const req = {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, settings }),
      };
      const resp = await fetch(url, req);
      if (!resp.ok) {
        throw new Error(resp.statusText);
      }
      const { league } = await resp.json();
      return league as League;
    },
    {
      onSuccess: (data) => {
        queryClient.setQueryData(["league", id], { league: data });
      },
    }
  );
  return { mutate, isLoading, isError };
};
