import { League, LineupSettings, Team } from "@ff-mern/ff-types";
import { useMutation, useQueryClient } from "react-query";

type UpdateLeagueRequest = {
  league?: League;
  teams: Team[];
  deletedTeams: Team[];
  leagueName: string;
  posInfo: LineupSettings;
  numSuperflex: number;
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
      const url = `${import.meta.env.VITE_PUBLIC_URL}/api/v1/league/${leagueId}/update/`;
      const body = {
        league: {
          ...info.league,
          logo: settings.changed ? settings.imageId : info?.league?.logo,
          name: info.leagueName,
          lineupSettings: info.posInfo,
          numSuperflex: info.numSuperflex,
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
      const resp = await fetch(url, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!resp.ok) {
        throw new Error(resp.statusText);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["league", leagueId]);
        queryClient.invalidateQueries(["teams", leagueId]);
      },
    }
  );
};
