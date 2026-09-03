import {
  LineupSettings,
  QuicksetLineupType,
  SingleTeamResponse,
  Team,
  UpdateAllTeamsResponse,
} from "@ff-mern/ff-types";
import { useMutation, useQueryClient } from "react-query";
import { apiPost } from "../../API/client";
import { getWeeklyLineup } from "../../Components/utils/getWeeklyLineup";
import { queryKeys } from "./queryKeys";

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
            const { team: updated } = await apiPost<SingleTeamResponse>(
              `/api/v1/team/setLineupFromProjection/`,
              {
                team,
                week: week.toString(),
                type: info.type,
                lineupSettings,
              }
            );
            return updated;
          })
        ),
      };
    },
    {
      onSuccess: (data) => {
        console.log(data);
        queryClient.setQueryData(queryKeys.teams(leagueId), {
          teams: data.teams,
        });
        queryClient.invalidateQueries(queryKeys.teams(leagueId));
        queryClient.invalidateQueries(queryKeys.allTeams());
      },
    }
  );
};
