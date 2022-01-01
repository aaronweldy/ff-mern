import { useEffect, useState } from "react";
import { auth } from "../firebase-config";
import { League, Team } from "../ff-types/types";

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
