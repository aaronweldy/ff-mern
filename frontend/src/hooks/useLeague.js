import { useEffect, useState } from 'react';
import { auth } from '../firebase-config';

export const useLeague = (id) => {
  const [league, setLeague] = useState(null);
  const [teams, setTeams] = useState([]);
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const url = `/api/v1/league/${id}/`;
        const resp = await fetch(url);
        const json = await resp.json();
        setLeague(json.league);
        setTeams(json.teams);
      }
    });
    return () => unsub();
  }, [id]);
  return { league, teams };
};
