import { RosteredPlayer, AbbreviatedNflTeam, SinglePosition } from "@ff-mern/ff-types";
import { useMutation, useQueryClient } from "react-query";

type AddPlayerRequest = {
  fullName: string;
  team: AbbreviatedNflTeam;
  position: SinglePosition;
};

type AddPlayerResponse = {
  players: RosteredPlayer[];
};

export const useAddPlayerToGlobalMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<AddPlayerResponse, Error, AddPlayerRequest>(
    async (playerData) => {
      const url = `${import.meta.env.VITE_PUBLIC_URL}/api/v1/nflData/addPlayer/`;
      const req = {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(playerData),
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
