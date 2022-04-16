import { useEffect, useMemo, useState } from "react";
import { useLeague } from "./query/useLeague";
import { usePlayerScores } from "./query/usePlayerScores";
import { useTeams } from "./query/useTeams";

export const useLeagueScoringData = (id: string) => {
  const { league, isLoading: leagueLoading } = useLeague(id);
  const { teams, setTeams, isLoading: teamsLoading } = useTeams(id);
  const [week, setWeek] = useState<number>(1);
  const { data: playerData, isLoading: scoresLoading } = usePlayerScores(
    id,
    week
  );
  useEffect(() => {
    if (league) {
      setWeek(league.lastScoredWeek);
    }
  }, [league]);

  const isLoading = useMemo(() => {
    return leagueLoading || teamsLoading || scoresLoading;
  }, [leagueLoading, teamsLoading, scoresLoading]);

  return {
    league,
    teams,
    setTeams,
    playerData,
    week,
    setWeek,
    isLoading,
  };
};
