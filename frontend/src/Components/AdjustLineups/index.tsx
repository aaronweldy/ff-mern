import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Container, Col, Row } from "react-bootstrap";
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
import { useSingleTeam } from "../../hooks/query/useSingleTeam";
import { useUpdateSingleTeamMutation } from "../../hooks/query/useUpdateSingleTeamMutation";
import { TeamSelectionDropdown } from "../shared/TeamSelectionDropdown";

export default function AdjustLineups() {
  const { id } = useParams() as { id: string };
  const [selectedTeamId, setSelectedTeamId] = useState<string>();
  const { league, teams, week, setWeek } = useLeagueScoringData(id);
  const { team: selectedTeam } = useSingleTeam(selectedTeamId);
  const scheduleQuery = useNflSchedule();
  const defenseStatsQuery = useNflDefenseStats();
  const { handlePlayerChange, handleBenchPlayer } = useTeamTable();
  const { mutate: updateTeam } = useUpdateSingleTeamMutation(selectedTeamId);
  const [lineupsPerTeam, setLineupsPerTeam] = useState(
    {} as Record<string, FinalizedLineup>
  );

  useEffect(() => {
    if (teams.length > 0 && league) {
      if (!selectedTeamId) {
        setSelectedTeamId(() => teams[0].id);
      }
      setLineupsPerTeam(
        teams.reduce((acc: Record<string, FinalizedLineup>, team: Team) => {
          acc[team.id] = getWeeklyLineup(week, team, league.lineupSettings);
          return acc;
        }, {})
      );
    }
  }, [teams, league, week, selectedTeamId]);

  const updateSelectedTeam = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTeamId(e.target.value);
  };

  const onPlayerChange = (
    selectedPlayer: FinalizedPlayer,
    name: string,
    swapPlayer: FinalizedPlayer,
    selectedIndex: number,
    teamId?: string
  ) => {
    if (teamId && selectedTeam) {
      handlePlayerChange(
        selectedPlayer,
        name,
        swapPlayer,
        selectedIndex,
        lineupsPerTeam[teamId]
      );
      selectedTeam.weekInfo[week].finalizedLineup = lineupsPerTeam[teamId];
      updateTeam(selectedTeam);
    }
  };

  const onBench = (selectedPlayer: FinalizedPlayer, teamId?: string) => {
    if (teamId && selectedTeam) {
      handleBenchPlayer(selectedPlayer, lineupsPerTeam[teamId]);
      selectedTeam.weekInfo[week].finalizedLineup = lineupsPerTeam[teamId];
      updateTeam(selectedTeam);
    }
  };

  /* const submitLineups = () => {
    updateTeams();
    setSuccess(true);
    setTimeout(() => setSuccess(false), 8000);
  };*/

  return (
    <Container id="small-left">
      <LeagueButton id={id} />
      <EditWeek
        week={week}
        maxWeeks={league?.numWeeks}
        onChange={(e) => setWeek(parseInt(e.target.value))}
      />
      <TeamSelectionDropdown
        teams={teams}
        selectedTeam={selectedTeamId}
        updateTeam={updateSelectedTeam}
      />
      {selectedTeam &&
        league &&
        scheduleQuery.isSuccess &&
        defenseStatsQuery.isSuccess && (
          <Row>
            <Col xs={12}>
              <h2>{selectedTeam.name}</h2>
            </Col>
            <Col xs={12}>
              <h4>Starters</h4>
            </Col>
            <Col xs={12}>
              <TeamTable
                players={lineupsPerTeam[selectedTeam.id]}
                positionsInTable={league.lineupSettings}
                name="starters"
                nflDefenseStats={defenseStatsQuery.data?.data}
                nflSchedule={scheduleQuery.data?.schedule}
                week={week.toString() as Week}
                handleBenchPlayer={onBench}
                handlePlayerChange={onPlayerChange}
                isOwner
                teamId={selectedTeam.id}
              />
            </Col>
            <Col xs={12}>
              <h4>Bench</h4>
            </Col>
            <Col xs={12}>
              <TeamTable
                players={lineupsPerTeam[selectedTeam.id]}
                positionsInTable={{ bench: 1 } as LineupSettings}
                name="bench"
                nflDefenseStats={defenseStatsQuery.data?.data}
                nflSchedule={scheduleQuery.data?.schedule}
                week={week.toString() as Week}
                handleBenchPlayer={onBench}
                handlePlayerChange={onPlayerChange}
                isOwner
                teamId={selectedTeam.id}
              />
            </Col>
          </Row>
        )}
    </Container>
  );
}
