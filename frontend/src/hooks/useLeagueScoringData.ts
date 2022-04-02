import { useEffect, useState } from "react";
import { useLeague } from "./query/useLeague";
import { usePlayerScores } from "./query/usePlayerScores";
import { useTeams } from "./query/useTeams";

export const useLeagueScoringData = (id: string) => {
  const { league } = useLeague(id);
  const { teams, setTeams } = useTeams(id);
  const [week, setWeek] = useState<number>(1);
  const { data: playerData } = usePlayerScores(id, week);
  useEffect(() => {
    if (league) {
      setWeek(
        league.lastScoredWeek + 1 < league.numWeeks
          ? league.lastScoredWeek + 1
          : league.lastScoredWeek
      );
    }
  }, [league]);
  return {
    league,
    teams,
    setTeams,
    playerData,
    week,
    setWeek,
  };
};
