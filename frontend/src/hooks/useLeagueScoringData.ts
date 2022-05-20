import { useEffect, useMemo, useState } from "react";
import { useLeague } from "./query/useLeague";
import { useNflDefenseStats } from "./query/useNflDefenseStats";
import { useNflSchedule } from "./query/useNflSchedule";
import { usePlayerScores } from "./query/usePlayerScores";
import { useTeams } from "./query/useTeams";

export const useLeagueScoringData = (id: string) => {
  const { league, isLoading: leagueLoading } = useLeague(id);
  const { teams, setTeams, query: teamsQuery } = useTeams(id);
  const [week, setWeek] = useState<number>(1);
  const { data: playerData, isLoading: scoresLoading } = usePlayerScores(
    id,
    week
  );
  const nflScheduleQuery = useNflSchedule();
  const defenseStatsQuery = useNflDefenseStats();
  useEffect(() => {
    if (league) {
      setWeek(league.lastScoredWeek);
    }
  }, [league]);

  const isLoading = useMemo(() => {
    return (
      leagueLoading ||
      teamsQuery.isLoading ||
      scoresLoading ||
      nflScheduleQuery.isLoading ||
      defenseStatsQuery.isLoading
    );
  }, [
    leagueLoading,
    teamsQuery.isLoading,
    scoresLoading,
    nflScheduleQuery,
    defenseStatsQuery,
  ]);

  return {
    league,
    teams,
    setTeams,
    playerData,
    week,
    setWeek,
    isLoading,
    nflScheduleQuery,
    defenseStatsQuery,
    teamsLoading: teamsQuery.isLoading,
    leagueLoading,
  };
};
