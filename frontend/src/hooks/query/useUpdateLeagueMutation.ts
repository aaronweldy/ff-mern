import { League, LineupSettings, Team } from "@ff-mern/ff-types";
import { useMutation, useQueryClient } from "react-query";
import { apiPatch } from "../../API/client";
import { queryKeys } from "./queryKeys";

type UpdateLeagueRequest = {
  league?: League;
  teams: Team[];
  deletedTeams: Team[];
  leagueName: string;
  posInfo: LineupSettings;
  numSuperflex: number;
  numWeeks: number;
};

type MutationSettings = {
  imageId: string;
  changed: boolean;
};

export const useUpdateLeagueMutation = (
  leagueId: string,
  info: UpdateLeagueRequest
) => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, MutationSettings>(
    async (settings) => {
      const body = {
        league: {
          ...info.league,
          logo: settings.changed ? settings.imageId : info?.league?.logo,
          name: info.leagueName,
          lineupSettings: info.posInfo,
          numSuperflex: info.numSuperflex,
          numWeeks: info.numWeeks,
          commissioners: info.teams
            .filter((team) => team.owner !== "default" && team.isCommissioner)
            .map((team) => team.owner),
        },
        teams: info.teams.map((team) => {
          return {
            ...team,
            leagueLogo: settings.changed
              ? settings.imageId
              : info?.league?.logo,
          } as Team;
        }),
        deletedTeams: info.deletedTeams,
      };
      await apiPatch<void>(`/api/v1/league/${leagueId}/update/`, body);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(queryKeys.league(leagueId));
        queryClient.invalidateQueries(queryKeys.teams(leagueId));
      },
    }
  );
};
