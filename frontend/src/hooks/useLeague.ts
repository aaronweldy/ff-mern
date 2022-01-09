import { useEffect, useState } from "react";
import { League } from "../ff-types/League";
import { Team } from "../ff-types/Team";
import { auth } from "../firebase-config";

type ApiResponse = {
  league: League;
  teams: Team[];
};

export const useLeague = (id: string) => {
  const [league, setLeague] = useState<League | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const url = `${process.env.REACT_APP_PUBLIC_URL}/api/v1/league/${id}/`;
        const resp = await fetch(url);
        const { league: respLeague, teams: respTeams } =
          (await resp.json()) as ApiResponse;
        setLeague(respLeague);
        setTeams(respTeams);
      }
    });
    return () => unsub();
  }, [id]);
  return { league, teams };
};
