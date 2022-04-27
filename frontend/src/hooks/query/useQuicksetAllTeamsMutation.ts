import {
  LineupSettings,
  QuicksetLineupType,
  SingleTeamResponse,
  Team,
  UpdateAllTeamsResponse,
} from "@ff-mern/ff-types";
import { useMutation, useQueryClient } from "react-query";
import { getWeeklyLineup } from "../../Components/utils/getWeeklyLineup";

export type QuicksetAllTeamsRequest = {
  type: QuicksetLineupType;
};

export const useUpdateAllTeamsMutation = (
  leagueId: string,
  teams: Team[],
  week: number,
  lineupSettings?: LineupSettings
) => {
  const queryClient = useQueryClient();
  return useMutation<UpdateAllTeamsResponse, Error, QuicksetAllTeamsRequest>(
    async (info) => {
      return {
        teams: await Promise.all<Team>(
          teams.map(async (team) => {
            if (Object.keys(team.weekInfo[week].finalizedLineup).length === 0) {
              team.weekInfo[week].finalizedLineup = getWeeklyLineup(
                week,
                team,
                lineupSettings
              );
            }
            const url = `${process.env.REACT_APP_PUBLIC_URL}/api/v1/team/setLineupFromProjection/`;
            const body = JSON.stringify({
              team,
              week: week.toString(),
              type: info.type,
              lineupSettings,
            });
            const req = {
              method: "POST",
              headers: { "content-type": "application/json" },
              body,
            };
            const resp = await fetch(url, req);
            if (!resp.ok) {
              throw new Error(resp.statusText);
            }
            return ((await resp.json()) as SingleTeamResponse).team;
          })
        ),
      };
    },
    {
      onSuccess: (data) => {
        console.log(data);
        queryClient.setQueryData(["teams", leagueId], { teams: data.teams });
        queryClient.invalidateQueries("team");
      },
    }
  );
};
