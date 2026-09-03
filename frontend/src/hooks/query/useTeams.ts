import { Team } from "@ff-mern/ff-types";
import { useQuery, useQueryClient } from "react-query";
import { apiGet } from "../../API/client";
import { queryKeys } from "./queryKeys";

type TeamsResponse = { teams: Team[] };

const fetchTeams = (leagueId: string) =>
  apiGet<TeamsResponse>(`/api/v1/league/${leagueId}/teams/`);

export const useTeams = (leagueId: string) => {
  const queryClient = useQueryClient();
  const query = useQuery(queryKeys.teams(leagueId), () => fetchTeams(leagueId), {
    staleTime: 1000 * 10 * 60,
  });
  const teams = query.data?.teams ?? [];
  // Kept for optimistic local editing (EditRosters, AddPoints, ...).
  // Writes straight to the query cache so all readers stay in sync.
  const setTeams = (
    update: Team[] | ((prev: Team[]) => Team[])
  ) => {
    queryClient.setQueryData<TeamsResponse | undefined>(
      queryKeys.teams(leagueId),
      (prev) => {
        const next =
          typeof update === "function"
            ? (update as (p: Team[]) => Team[])(prev?.teams ?? [])
            : update;
        return { teams: next };
      }
    );
  };
  return { teams, setTeams, query };
};
