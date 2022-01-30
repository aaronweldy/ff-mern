import React, { useState, useEffect } from "react";
import { Redirect, useParams } from "react-router-dom";
import { Alert, Container, Col, Row, Button } from "react-bootstrap";
import { auth } from "../../firebase-config";
import LeagueButton from "../shared/LeagueButton";
import { TeamTable } from "../shared/TeamTable";
import EditWeek from "../shared/EditWeek";
import { useLeague } from "../../hooks/useLeague";
import "../../CSS/LeaguePages.css";
import {
  Team,
  FinalizedLineup,
  FinalizedPlayer,
  LineupSettings,
  Week,
} from "@ff-mern/ff-types";
import { getWeeklyLineup } from "../utils/getWeeklyLineup";
import { useTeamTable } from "../../hooks/useTeamTable";
import { useNflSchedule } from "../../hooks/useNflSchedule";
import { useNflDefenseStats } from "../../hooks/useNflDefenseStats";

export default function AdjustLineups() {
  const { id } = useParams<{ id: string }>();
  const { league, teams: initTeams } = useLeague(id);
  const schedule = useNflSchedule();
  const defenseStats = useNflDefenseStats();
  const [teams, setTeams] = useState<Team[]>([]);
  const [success, setSuccess] = useState(false);
  const [week, setWeek] = useState(1);
  const { handlePlayerChange, handleBenchPlayer } = useTeamTable();
  const [lineupsPerTeam, setLineupsPerTeam] = useState(
    {} as Record<string, FinalizedLineup>
  );
  const currUser = auth.currentUser;
  useEffect(() => {
    if (teams && league) {
      setLineupsPerTeam(
        teams.reduce((acc: Record<string, FinalizedLineup>, team: Team) => {
          console.log(week);
          acc[team.id] = getWeeklyLineup(week, team, league.lineupSettings);
          return acc;
        }, {})
      );
    }
  }, [teams, league, week]);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(() => {
      if (league) {
        setWeek(league.lastScoredWeek + 1);
        setTeams(initTeams);
      }
    });
    return () => unsub();
  }, [league, initTeams]);

  const onPlayerChange = (
    selectedPlayer: FinalizedPlayer,
    name: string,
    swapPlayer: FinalizedPlayer,
    selectedIndex: number,
    teamId: string
  ) => {
    handlePlayerChange(
      selectedPlayer,
      name,
      swapPlayer,
      selectedIndex,
      lineupsPerTeam[teamId]
    );
    setTeams([...teams]);
  };

  const onBench = (selectedPlayer: FinalizedPlayer, teamId: string) => {
    handleBenchPlayer(selectedPlayer, lineupsPerTeam[teamId]);
    setTeams([...teams]);
  };

  const submitLineups = () => {
    const tempTeams = [...teams];
    for (const team of tempTeams) {
      team.rosteredPlayers = team.rosteredPlayers.filter(
        (player) => player.name !== ""
      );
    }
    const url = `${process.env.REACT_APP_PUBLIC_URL}/api/v1/league/updateTeams/`;
    const body = { teams: tempTeams };
    const reqdict = {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    };
    fetch(url, reqdict)
      .then((data) => data.json())
      .then(() => {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 8000);
      });
  };

  if (league && !league.commissioners.includes(currUser!.uid)) {
    return <Redirect to={`/league/${id}/`} />;
  }

  return (
    <Container id="small-left">
      <LeagueButton id={id} />
      <EditWeek
        week={week}
        maxWeeks={league?.numWeeks}
        onChange={(e) => setWeek(parseInt(e.target.value))}
      />
      {teams && league && Object.keys(lineupsPerTeam).length > 0
        ? teams.map((team, i) => {
            console.log(lineupsPerTeam);
            return (
              <>
                <Row key={i}>
                  <Col xs={12}>
                    <h2>{team.name}</h2>
                  </Col>
                  <Col xs={12}>
                    <h4>Starters</h4>
                  </Col>
                  <Col>
                    <TeamTable
                      players={lineupsPerTeam[team.id]}
                      positionsInTable={league.lineupSettings}
                      name="starters"
                      nflDefenseStats={defenseStats}
                      nflSchedule={schedule}
                      week={week.toString() as Week}
                      handleBenchPlayer={(selectedPlayer: FinalizedPlayer) =>
                        onBench(selectedPlayer, team.id)
                      }
                      handlePlayerChange={(
                        selectedPlayer: FinalizedPlayer,
                        name: string,
                        swapPlayer: FinalizedPlayer,
                        selectedIndex: number
                      ) =>
                        onPlayerChange(
                          selectedPlayer,
                          name,
                          swapPlayer,
                          selectedIndex,
                          team.id
                        )
                      }
                      isOwner
                    />
                    <div>
                      <h4>Bench</h4>
                    </div>
                    <TeamTable
                      players={lineupsPerTeam[team.id]}
                      positionsInTable={{ bench: 1 } as LineupSettings}
                      name="bench"
                      nflDefenseStats={defenseStats}
                      nflSchedule={schedule}
                      week={week.toString() as Week}
                      handleBenchPlayer={(selectedPlayer: FinalizedPlayer) =>
                        onBench(selectedPlayer, team.id)
                      }
                      handlePlayerChange={(
                        selectedPlayer: FinalizedPlayer,
                        name: string,
                        swapPlayer: FinalizedPlayer,
                        selectedIndex: number
                      ) =>
                        onPlayerChange(
                          selectedPlayer,
                          name,
                          swapPlayer,
                          selectedIndex,
                          team.id
                        )
                      }
                      isOwner
                    />
                  </Col>
                </Row>
              </>
            );
          })
        : ""}
      <Row>
        <Col>
          <Button
            variant="success"
            className="mt-3 mb-4"
            onClick={submitLineups}
          >
            Submit Lineups
          </Button>
        </Col>
      </Row>
      {success ? (
        <Row>
          <Col sm={5}>
            <Alert className="mb-3" variant="success">
              Submitted lineups! <a href={`/league/${id}/`}>Back to home</a>
            </Alert>
          </Col>
        </Row>
      ) : (
        ""
      )}
    </Container>
  );
}
