import {
  League,
  PlayerScoreData,
  PlayerScoresResponse,
  Team,
} from "@ff-mern/ff-types";
import { useEffect, useState } from "react";
import { API } from "../API";
import { auth } from "../firebase-config";

export const useLeagueScoringData = (id: string) => {
  const [league, setLeague] = useState<League>();
  const [teams, setTeams] = useState<Team[]>([]);
  const [playerData, setPlayerData] = useState<PlayerScoreData>();
  const [isCommissioner, setIsCommissioner] = useState(false);
  const [week, setWeek] = useState<number | null>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) {
        API.fetchPlayerScores({ leagueId: id, week: week || 1 }).then(
          (resp: PlayerScoresResponse) => {
            console.log(resp.players);
            setTeams(resp.teams);
            setLeague(resp.league);
            setWeek(week || resp.league.lastScoredWeek + 1);
            setPlayerData(resp.players);
            setIsCommissioner(resp.league.commissioners.includes(user.uid));
          }
        );
      }
    });
    return () => unsub();
  }, [id, week]);
  return {
    league,
    teams,
    setTeams,
    playerData,
    setPlayerData,
    week,
    setWeek,
    isCommissioner,
  };
};
