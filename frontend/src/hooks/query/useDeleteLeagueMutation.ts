import { useAuthUser } from "@react-query-firebase/auth";
import { useMutation, useQueryClient } from "react-query";
import { apiPost } from "../../API/client";
import { auth } from "../../firebase-config";
import { queryKeys } from "./queryKeys";

export const useDeleteLeagueMutation = (leagueId: string) => {
  const user = useAuthUser("user", auth);
  const queryClient = useQueryClient();
  return useMutation<void, Error>(
    async () => {
      await apiPost<void>(`/api/v1/league/${leagueId}/delete/`, {
        user: user?.data?.uid,
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(queryKeys.league(leagueId));
        queryClient.invalidateQueries(queryKeys.teams(leagueId));
        queryClient.invalidateQueries(
          queryKeys.teamsForUser(user?.data?.uid)
        );
      },
    }
  );
};
