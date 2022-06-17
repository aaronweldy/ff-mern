import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Container, Col, Row } from "react-bootstrap";
import LeagueButton from "../shared/LeagueButton";
import { TeamTable } from "../shared/TeamTable";
import EditWeek from "../shared/EditWeek";
import "../../CSS/LeaguePages.css";
import {
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
import { TeamSelectionDropdown } from "../shared/TeamSelectionDropdown";
import { QuicksetDropdown } from "../shared/QuicksetDropdown";
import { useUpdateAllTeamsMutation } from "../../hooks/query/useQuicksetAllTeamsMutation";
import { QuicksetAllDropdown } from "./QuicksetAllDropdown";

export default function AdjustLineups() {
  const { id } = useParams() as { id: string };
  const [selectedTeamId, setSelectedTeamId] = useState<string>();
  const { league, teams, week, setWeek } = useLeagueScoringData(id);
  const updateAllLineups = useUpdateAllTeamsMutation(
    id,
    teams,
    week,
    league?.lineupSettings
  );
  const {
    team: selectedTeam,
    updateTeamMutation,
    setHighestProjectedLineupMutation,
  } = useSingleTeam(selectedTeamId);
  const scheduleQuery = useNflSchedule();
  const defenseStatsQuery = useNflDefenseStats();
  const { handlePlayerChange, handleBenchPlayer } = useTeamTable();
  const currentLineup = useMemo(() => {
    if (selectedTeam && league) {
      return getWeeklyLineup(week, selectedTeam, league.lineupSettings);
    }
    return {} as FinalizedLineup;
  }, [selectedTeam, week, league]);
  useEffect(() => {
    if (teams.length > 0 && league) {
      if (!selectedTeamId) {
        setSelectedTeamId(() => teams[0].id);
      }
    }
  }, [teams, selectedTeamId, league]);

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
        currentLineup
      );
      selectedTeam.weekInfo[week].finalizedLineup = currentLineup;
      updateTeamMutation.mutate(selectedTeam);
    }
  };

  const onBench = (selectedPlayer: FinalizedPlayer, teamId?: string) => {
    if (teamId && selectedTeam) {
      handleBenchPlayer(selectedPlayer, currentLineup);
      selectedTeam.weekInfo[week].finalizedLineup = currentLineup;
      updateTeamMutation.mutate(selectedTeam);
    }
  };

  return (
    <Container>
      <Row className="mt-3">
        <Col>
          <LeagueButton id={id} />
        </Col>
      </Row>
      <EditWeek
        week={week}
        maxWeeks={league?.numWeeks}
        onChange={(e) => setWeek(parseInt(e.target.value))}
      />
      <Row className="mb-3">
        <Col>
          <QuicksetAllDropdown mutationFn={updateAllLineups} />
        </Col>
      </Row>
      <Row>
        <Col xl={3}>
          <TeamSelectionDropdown
            teams={teams}
            selectedTeam={selectedTeamId}
            updateTeam={updateSelectedTeam}
          />
        </Col>
      </Row>
      {selectedTeam &&
        league &&
        scheduleQuery.isSuccess &&
        defenseStatsQuery.isSuccess && (
          <Row className="mt-3">
            <Col sm={2}>
              <h2>{selectedTeam.name}</h2>
            </Col>
            <Col>
              <QuicksetDropdown
                week={week}
                mutationFn={setHighestProjectedLineupMutation}
                lineupSettings={league.lineupSettings}
              />
            </Col>
            <Col xs={12}>
              <h4>Starters</h4>
            </Col>
            <Col xs={12}>
              <TeamTable
                players={currentLineup}
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
                players={currentLineup}
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
      {(setHighestProjectedLineupMutation.isLoading ||
        updateAllLineups.isLoading) && <div className="spinning-loader" />}
    </Container>
  );
}
