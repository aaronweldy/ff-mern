import { Team } from "@ff-mern/ff-types";
import { useState } from "react";
import { useQuery } from "react-query";

const fetchSingleTeam = async (teamId?: string) => {
  const url = `${process.env.REACT_APP_PUBLIC_URL}/api/v1/team/${teamId}/`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(resp.statusText);
  }
  return (await resp.json()) as SingleTeamResponse;
};

type SingleTeamResponse = {
  team: Team;
};

export const useSingleTeam = (teamId?: string) => {
  const [team, setTeam] = useState<Team>();
  const { isSuccess } = useQuery<SingleTeamResponse, Error>(
    ["team", teamId],
    () => fetchSingleTeam(teamId),
    {
      onSuccess: (data) => {
        setTeam(data.team);
      },
      enabled: !!teamId,
    }
  );
  return { team, setTeam, isSuccess };
};
