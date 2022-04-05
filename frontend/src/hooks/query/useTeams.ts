import { Team } from "@ff-mern/ff-types";
import { useState } from "react";
import { useQuery } from "react-query";

const fetchTeams = async (leagueId: string) => {
  const url = `${process.env.REACT_APP_PUBLIC_URL}/api/v1/league/${leagueId}/teams/`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(resp.statusText);
  }
  return (await resp.json()) as { teams: Team[] };
};

export const useTeams = (leagueId: string) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const { isLoading, isSuccess } = useQuery(
    ["teams", leagueId],
    () => fetchTeams(leagueId),
    {
      onSuccess: (data) => {
        setTeams(data.teams);
      },
      staleTime: 1000 * 10 * 60,
    }
  );
  return { teams, setTeams, isLoading, isSuccess };
};
