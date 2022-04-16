import { Team, PositionInfo } from "@ff-mern/ff-types";
import { useMutation } from "react-query";

type CreateLeagueType = {
  league: string;
  teams: Team[];
  posInfo: PositionInfo;
  scoring: string;
  numWeeks: number;
  numSuperflex: number;
};

type CreateLeagueResponse = {
  id: string;
};

export const useCreateLeagueMutation = (info: CreateLeagueType) => {
  return useMutation<CreateLeagueResponse, Error, string>(async (id) => {
    const url = `${process.env.REACT_APP_PUBLIC_URL}/api/v1/league/create/`;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ ...info, logo: id }),
    });
    if (!resp.ok) {
      throw new Error(resp.statusText);
    }
    return (await resp.json()) as CreateLeagueResponse;
  });
};
