import { TeamFantasyPositionPerformance } from "@ff-mern/ff-types";
import { useEffect, useState } from "react";
import { API } from "../API";
import { auth } from "../firebase-config";

export const useNflDefenseStats = () => {
  const [stats, setStats] = useState<TeamFantasyPositionPerformance>();
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(() =>
      API.fetchNflDefenseStats().then((data) => setStats(data))
    );
    return () => unsub();
  }, []);
  return stats;
};
