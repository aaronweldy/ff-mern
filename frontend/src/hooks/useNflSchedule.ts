import { TeamToSchedule } from "@ff-mern/ff-types";
import { useEffect, useState } from "react";
import { API } from "../API";
import { auth } from "../firebase-config";

export const useNflSchedule = () => {
  const [schedule, setSchedule] = useState<TeamToSchedule>();
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(() =>
      API.fetchNflSchedule().then((data) => setSchedule(data))
    );
    return () => unsub();
  }, []);

  return schedule;
};
