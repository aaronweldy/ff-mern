import { RosteredPlayer } from "@ff-mern/ff-types";
import { useMutation, useQueryClient } from "react-query";

type SyncPlayersResponse = {
  players: RosteredPlayer[];
};

export const useSyncPlayersMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<SyncPlayersResponse, Error>(
    async () => {
      const url = `${import.meta.env.VITE_PUBLIC_URL}/api/v1/nflData/syncPlayers/`;
      const req = {
        method: "POST",
        headers: { "content-type": "application/json" },
      };
      const data = await fetch(url, req);
      if (!data.ok) {
        throw new Error(data.statusText);
      }
      return await data.json();
    },
    {
      onSuccess: (data) => {
        queryClient.setQueryData("players", data);
      },
    }
  );
};
