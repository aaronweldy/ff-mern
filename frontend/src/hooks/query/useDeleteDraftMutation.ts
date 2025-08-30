import { useMutation, useQueryClient } from "react-query";

export const useDeleteDraftMutation = (leagueId: string, draftId: string) => {
  const queryClient = useQueryClient();
  return useMutation<void, Error>(
    async () => {
      const url = `${import.meta.env.VITE_PUBLIC_URL}/api/v1/draft/${draftId}/`;
      const options = {
        method: "DELETE",
      };
      const data = await fetch(url, options);
      if (!data.ok) {
        throw new Error(data.statusText);
      }
    },
    {
      onSuccess: () => {
        queryClient.setQueryData(["draftForLeague", leagueId], {
          draft: null,
        });
      },
    }
  );
};
