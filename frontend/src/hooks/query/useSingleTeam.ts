import { QuicksetRequest, SingleTeamResponse, Team } from "@ff-mern/ff-types";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { apiGet, apiPost, apiPut } from "../../API/client";
import { queryKeys } from "./queryKeys";

const fetchSingleTeam = (teamId?: string) =>
  apiGet<SingleTeamResponse>(`/api/v1/team/${teamId}/`);

export const useSingleTeam = (teamId?: string) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { data, isLoading, isSuccess } = useQuery<SingleTeamResponse, Error>(
    queryKeys.team(teamId),
    () => fetchSingleTeam(teamId),
    {
      enabled: !!teamId,
    }
  );
  const team = data?.team;
  // Optimistic-UI helper (local edits before mutate). Reads use `team`.
  const setTeam = (
    update: Team | undefined | ((prev: Team | undefined) => Team | undefined)
  ) => {
    queryClient.setQueryData<SingleTeamResponse | undefined>(
      queryKeys.team(teamId),
      (prev) => {
        const next =
          typeof update === "function"
            ? (update as (p: Team | undefined) => Team | undefined)(prev?.team)
            : update;
        if (next === undefined) return prev;
        return { team: next };
      }
    );
  };
  const updateTeamMutation = useMutation<SingleTeamResponse, Error, { team: Team; isAdmin?: boolean }>(
    async ({ team: newTeam, isAdmin }) =>
      apiPut<SingleTeamResponse>(`/api/v1/team/updateSingleTeam/`, {
        team: newTeam,
        isAdmin,
      }),
    {
      onSuccess: (response) => {
        queryClient.setQueryData(queryKeys.team(teamId), {
          team: response.team,
        });
        queryClient.invalidateQueries(queryKeys.team(teamId));
        queryClient.invalidateQueries(queryKeys.allTeams());
      },
      onError: (error) => {
        console.error(error);
        setErrorMessage(`Failed to update team: ${error.message}`);
      },
    }
  );
  const setHighestProjectedLineupMutation = useMutation<
    SingleTeamResponse,
    Error,
    QuicksetRequest
  >(
    async (info) =>
      apiPost<SingleTeamResponse>(`/api/v1/team/setLineupFromProjection/`, {
        team,
        week: info.week,
        type: info.type,
        lineupSettings: info.lineupSettings,
      }),
    {
      onSuccess: (response) => {
        queryClient.setQueryData(queryKeys.team(teamId), {
          team: response.team,
        });
        queryClient.invalidateQueries(queryKeys.team(teamId));
        queryClient.invalidateQueries(queryKeys.allTeams());
      },
    }
  );
  return {
    team,
    setTeam,
    isLoading,
    isSuccess,
    updateTeamMutation,
    setHighestProjectedLineupMutation,
    errorMessage,
    setErrorMessage,
  };
};
