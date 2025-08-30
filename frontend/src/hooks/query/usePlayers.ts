import { RosteredPlayer } from "@ff-mern/ff-types";
import { useQuery } from "react-query";

const fetchPlayers = async () => {
  const url = `${import.meta.env.VITE_PUBLIC_URL}/api/v1/nflData/allPlayers/`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(resp.statusText);
  }
  return await resp.json();
};

type GlobalPlayersResponse = {
  players: RosteredPlayer[];
};

export const usePlayers = () => {
  return useQuery<GlobalPlayersResponse, Error>("players", fetchPlayers);
};
