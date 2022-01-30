import { RosteredPlayer } from "@ff-mern/ff-types";
import { useEffect, useState } from "react";
import { API } from "../API";
import { auth } from "../firebase-config";

export const usePlayers = () => {
  const [players, setPlayers] = useState<RosteredPlayer[]>([]);
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (user) {
        API.fetchGlobalPlayers().then((data) => {
          setPlayers(data);
        });
      }
    });
    return () => unsub();
  }, []);
  return players;
};
