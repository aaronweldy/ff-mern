import { Team } from "@ff-mern/ff-types";
import { useQuery } from "react-query";
import { apiGet } from "../../API/client";
import { queryKeys } from "./queryKeys";

const fetchUserTeams = (userId: string) =>
  apiGet<{ teams: Team[] }>(`/api/v1/user/${userId}/leagues/`);

type UserTeamsResponse = {
  teams: Team[];
};

export const useTeamsByUser = (userId?: string) => {
  return useQuery<UserTeamsResponse, Error>(
    queryKeys.teamsForUser(userId),
    () => fetchUserTeams(userId!),
    {
      enabled: !!userId,
    }
  );
};
