import { RosteredPlayer } from "@ff-mern/ff-types";
import { useMutation, useQueryClient } from "react-query";
import { apiPost } from "../../API/client";
import { queryKeys } from "./queryKeys";

type SyncPlayersResponse = {
  players: RosteredPlayer[];
};

export const useSyncPlayersMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<SyncPlayersResponse, Error>(
    async () => apiPost<SyncPlayersResponse>(`/api/v1/nflData/syncPlayers/`),
    {
      onSuccess: (data) => {
        queryClient.setQueryData(queryKeys.players(), data);
        queryClient.invalidateQueries(queryKeys.players());
      },
    }
  );
};
