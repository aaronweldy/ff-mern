import { Team } from "@ff-mern/ff-types";
import { useQuery } from "react-query";

const fetchUserTeams = async (userId: string) => {
  const url = `${process.env.REACT_APP_PUBLIC_URL}/api/v1/user/${userId}/leagues/`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(resp.statusText);
  }
  return await resp.json();
};

type UserTeamsResponse = {
  teams: Team[];
};

export const useTeamsByUser = (userId?: string) => {
  return useQuery<UserTeamsResponse, Error>(
    ["teamsForUser", userId],
    () => fetchUserTeams(userId!),
    {
      enabled: !!userId,
    }
  );
};
