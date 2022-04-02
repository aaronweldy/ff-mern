import { TeamToSchedule } from "@ff-mern/ff-types";
import { useQuery } from "react-query";

const fetchSchedule = async () => {
  const url = `${process.env.REACT_APP_PUBLIC_URL}/api/v1/nflData/nflSchedule/`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(resp.statusText);
  }
  return await resp.json();
};

type NflScheduleResponse = {
  schedule: TeamToSchedule;
};

export const useNflSchedule = () => {
  return useQuery<NflScheduleResponse, Error>("nflSchedule", fetchSchedule);
};
