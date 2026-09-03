import { RosteredPlayer } from "@ff-mern/ff-types";
import { useQuery } from "react-query";
import { apiGet } from "../../API/client";
import { queryKeys } from "./queryKeys";

const fetchPlayers = () =>
  apiGet<{ players: RosteredPlayer[] }>("/api/v1/nflData/allPlayers/");

type GlobalPlayersResponse = {
  players: RosteredPlayer[];
};

export const usePlayers = () => {
  return useQuery<GlobalPlayersResponse, Error>(
    queryKeys.players(),
    fetchPlayers
  );
};
