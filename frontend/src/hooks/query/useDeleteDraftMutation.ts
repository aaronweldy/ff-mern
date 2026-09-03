import { useMutation, useQueryClient } from "react-query";
import { apiDelete } from "../../API/client";
import { queryKeys } from "./queryKeys";

export const useDeleteDraftMutation = (leagueId: string, draftId: string) => {
  const queryClient = useQueryClient();
  return useMutation<void, Error>(
    async () => {
      await apiDelete<void>(`/api/v1/draft/${draftId}/`);
    },
    {
      onSuccess: () => {
        queryClient.setQueryData(queryKeys.draftForLeague(leagueId), {
          draft: null,
        });
        queryClient.invalidateQueries(queryKeys.draftForLeague(leagueId));
      },
    }
  );
};
