import { NFLSchedule } from "@ff-mern/ff-types";
import { useQuery } from "react-query";
import { apiGet } from "../../API/client";
import { queryKeys } from "./queryKeys";

const fetchSchedule = () =>
  apiGet<NFLSchedule>("/api/v1/nflData/nflSchedule/");

export const useNflSchedule = () => {
  return useQuery<NFLSchedule, Error>(queryKeys.nflSchedule(), fetchSchedule);
};
