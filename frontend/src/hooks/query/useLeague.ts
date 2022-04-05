import { League } from "@ff-mern/ff-types";
import { useState } from "react";
import { useQuery } from "react-query";

type ApiResponse = {
  league: League;
};

const getLeagueData = async (id: string) => {
  const url = `${process.env.REACT_APP_PUBLIC_URL}/api/v1/league/${id}/`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(resp.statusText);
  }
  const data: ApiResponse = await resp.json();
  return data;
};

export const useLeague = (id: string) => {
  const [league, setLeague] = useState<League>();
  const { isLoading, isSuccess } = useQuery(
    ["league", id],
    () => getLeagueData(id),
    {
      onSuccess: (data) => {
        setLeague(data.league);
      },
    }
  );
  return { league, setLeague, isLoading, isSuccess };
};
