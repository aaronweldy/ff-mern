import { useEffect, useState } from 'react';
import { auth } from '../firebase-config';

export const usePlayers = () => {
  const [players, setPlayers] = useState([]);
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const url = `${process.env.REACT_APP_PUBLIC_URL}/api/v1/league/allPlayers/`;
        const resp = await fetch(url);
        const json = await resp.json();
        setPlayers(json.players.players);
      }
    });
    return () => unsub();
  }, []);
  return players;
};
