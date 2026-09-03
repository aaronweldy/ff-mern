import { PositionInfo, Team } from "@ff-mern/ff-types";
import { useMutation, useQueryClient } from "react-query";
import { apiPost } from "../../API/client";
import { queryKeys } from "./queryKeys";

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
  const queryClient = useQueryClient();
  return useMutation<CreateLeagueResponse, Error, string>(
    async (id) =>
      apiPost<CreateLeagueResponse>(`/api/v1/league/create/`, {
        ...info,
        logo: id,
      }),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(queryKeys.league(data.id));
        queryClient.invalidateQueries(queryKeys.teams(data.id));
      },
    }
  );
};
