import { TeamFantasyPositionPerformance } from "@ff-mern/ff-types";
import { useQuery } from "react-query";

const fetchDefenseStats = async () => {
  const url = `${import.meta.env.VITE_PUBLIC_URL}/api/v1/nflData/nflDefenseStats/`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(resp.statusText);
  }
  return await resp.json();
};

type NflDefenseStatsResponse = {
  data: TeamFantasyPositionPerformance;
};

export const useNflDefenseStats = () => {
  return useQuery<NflDefenseStatsResponse, Error>(
    "nflDefenseStats",
    fetchDefenseStats
  );
};
