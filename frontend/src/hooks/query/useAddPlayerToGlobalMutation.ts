import { RosteredPlayer, AbbreviatedNflTeam, SinglePosition } from "@ff-mern/ff-types";
import { useMutation, useQueryClient } from "react-query";
import { apiPost } from "../../API/client";
import { queryKeys } from "./queryKeys";

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
    async (playerData) =>
      apiPost<AddPlayerResponse>(`/api/v1/nflData/addPlayer/`, playerData),
    {
      onSuccess: (data) => {
        queryClient.setQueryData(queryKeys.players(), data);
        queryClient.invalidateQueries(queryKeys.players());
      },
    }
  );
};
