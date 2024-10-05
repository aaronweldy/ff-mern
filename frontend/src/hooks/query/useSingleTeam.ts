import { QuicksetRequest, SingleTeamResponse, Team } from "@ff-mern/ff-types";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";

const fetchSingleTeam = async (teamId?: string) => {
  const url = `${process.env.REACT_APP_PUBLIC_URL}/api/v1/team/${teamId}/`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(resp.statusText);
  }
  return (await resp.json()) as SingleTeamResponse;
};

export const useSingleTeam = (teamId?: string) => {
  const [team, setTeam] = useState<Team>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { isLoading, isSuccess } = useQuery<SingleTeamResponse, Error>(
    ["team", teamId],
    () => fetchSingleTeam(teamId),
    {
      onSuccess: (data) => {
        setTeam(data.team);
      },
      enabled: !!teamId,
    }
  );
  const updateTeamMutation = useMutation<SingleTeamResponse, Error, Team>(
    async (newTeam: Team) => {
      const url = `${process.env.REACT_APP_PUBLIC_URL}/api/v1/team/updateSingleTeam/`;
      const body = JSON.stringify({ team: newTeam });
      const req = {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body,
      };
      const resp = await fetch(url, req);
      if (!resp.ok) {
        throw new Error(await resp.text());
      }
      return resp.json();
    },
    {
      onSuccess: (data) => {
        console.log(data);
        queryClient.setQueryData(["team", teamId], { team: data.team });
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
    async (info) => {
      const url = `${process.env.REACT_APP_PUBLIC_URL}/api/v1/team/setLineupFromProjection/`;
      const body = JSON.stringify({
        team,
        week: info.week,
        type: info.type,
        lineupSettings: info.lineupSettings,
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
      return resp.json();
    },
    {
      onSuccess: (data) => {
        queryClient.setQueryData(["team", teamId], { team: data.team });
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
