import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Alert, Container, Col, Row, Button } from "react-bootstrap";
import LeagueButton from "../shared/LeagueButton";
import { TeamTable } from "../shared/TeamTable";
import EditWeek from "../shared/EditWeek";
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
import { useNflSchedule } from "../../hooks/query/useNflSchedule";
import { useNflDefenseStats } from "../../hooks/query/useNflDefenseStats";
import { useLeagueScoringData } from "../../hooks/useLeagueScoringData";
import { useUpdateTeamsMutation } from "../../hooks/query/useUpdateTeamsMutation";

export default function AdjustLineups() {
  const { id } = useParams() as { id: string };
  const { league, teams, setTeams, week, setWeek } = useLeagueScoringData(id);
  const scheduleQuery = useNflSchedule();
  const defenseStatsQuery = useNflDefenseStats();
  const [success, setSuccess] = useState(false);
  const { handlePlayerChange, handleBenchPlayer } = useTeamTable();
  const { mutate: updateTeams } = useUpdateTeamsMutation(id, teams);
  const [lineupsPerTeam, setLineupsPerTeam] = useState(
    {} as Record<string, FinalizedLineup>
  );
  useEffect(() => {
    if (teams && league) {
      setLineupsPerTeam(
        teams.reduce((acc: Record<string, FinalizedLineup>, team: Team) => {
          acc[team.id] = getWeeklyLineup(week, team, league.lineupSettings);
          return acc;
        }, {})
      );
    }
  }, [teams, league, week]);

  const onPlayerChange = (
    selectedPlayer: FinalizedPlayer,
    name: string,
    swapPlayer: FinalizedPlayer,
    selectedIndex: number,
    teamId?: string
  ) => {
    if (teamId) {
      handlePlayerChange(
        selectedPlayer,
        name,
        swapPlayer,
        selectedIndex,
        lineupsPerTeam[teamId]
      );
      setTeams([...teams]);
    }
  };

  const onBench = (selectedPlayer: FinalizedPlayer, teamId?: string) => {
    if (teamId) {
      handleBenchPlayer(selectedPlayer, lineupsPerTeam[teamId]);
      setTeams([...teams]);
    }
  };

  const submitLineups = () => {
    updateTeams();
    setSuccess(true);
    setTimeout(() => setSuccess(false), 8000);
  };

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
                      nflDefenseStats={defenseStatsQuery.data?.data}
                      nflSchedule={scheduleQuery.data?.schedule}
                      week={week.toString() as Week}
                      handleBenchPlayer={onBench}
                      handlePlayerChange={onPlayerChange}
                      isOwner
                      teamId={team.id}
                    />
                    <div>
                      <h4>Bench</h4>
                    </div>
                    <TeamTable
                      players={lineupsPerTeam[team.id]}
                      positionsInTable={{ bench: 1 } as LineupSettings}
                      name="bench"
                      nflDefenseStats={defenseStatsQuery.data?.data}
                      nflSchedule={scheduleQuery.data?.schedule}
                      week={week.toString() as Week}
                      handleBenchPlayer={onBench}
                      handlePlayerChange={onPlayerChange}
                      isOwner
                      teamId={team.id}
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
