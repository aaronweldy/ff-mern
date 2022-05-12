import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Container, Button, Row, Col } from "react-bootstrap";
import LeagueButton from "../shared/LeagueButton";
import TeamScoringBreakdown from "./TeamScoringBreakdown";
import EditWeek from "../shared/EditWeek";
import "../../CSS/LeaguePages.css";
import { useLeagueScoringData } from "../../hooks/useLeagueScoringData";
import {
  ScoringToggleType,
  StatTypeToggleButton,
} from "../shared/StatTypeToggleButton";
import { useRunScoresMutation } from "../../hooks/query/useRunScoresMutation";
import { useSingleTeam } from "../../hooks/query/useSingleTeam";
import { TeamSelectionDropdown } from "../shared/TeamSelectionDropdown";

const RunScores = () => {
  const { id } = useParams() as { id: string };
  const {
    league,
    teams,
    week,
    setWeek,
    playerData,
    isLoading: leagueDataLoading,
  } = useLeagueScoringData(id);
  const [selectedTeamId, setSelectedTeamId] = useState<string>();
  const { team: selectedTeam, isLoading: teamLoading } =
    useSingleTeam(selectedTeamId);
  const [selectedDisplay, setDisplay] = useState<ScoringToggleType>("scoring");
  const { mutate: runScores, isLoading: scoresLoading } = useRunScoresMutation(
    id,
    week || 1,
    teams
  );
  const dataLoading = leagueDataLoading || teamLoading || scoresLoading;

  useEffect(() => {
    if (teams.length > 0 && !selectedTeamId) {
      setSelectedTeamId(() => teams[0].id);
    }
  }, [teams, selectedTeamId]);

  const updateSelectedTeam = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTeamId(e.target.value);
  };

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplay(e.target.value as ScoringToggleType);
  };

  return (
    <Container fluid className="pl-5">
      <Row className="mt-2">
        <Col>
          <LeagueButton id={id} />
        </Col>
      </Row>
      <Row>
        <Col className="mt-3">
          <span className="mr-3">Display:</span>
          <StatTypeToggleButton
            selected={selectedDisplay}
            onChange={handleToggle}
          />
        </Col>
      </Row>
      <EditWeek
        week={week || 1}
        maxWeeks={league?.numWeeks}
        onChange={(e) => setWeek(parseInt(e.target.value))}
      />
      {league && teams && playerData && selectedTeam && (
        <>
          <TeamSelectionDropdown
            teams={teams}
            selectedTeam={selectedTeamId}
            updateTeam={updateSelectedTeam}
          />
          <Row>
            <Col>
              <TeamScoringBreakdown
                leagueScoringCategories={league.scoringSettings}
                team={selectedTeam}
                allTeams={teams}
                week={week || 1}
                playerData={playerData.players}
                dataDisplay={selectedDisplay}
              />
            </Col>
          </Row>
        </>
      )}
      <Row className="mb-3">
        <Col>
          <Button variant="success" onClick={() => runScores()}>
            Calculate Scores
          </Button>
        </Col>
      </Row>
      {dataLoading ? <div className="spinning-loader" /> : ""}
    </Container>
  );
};

export default RunScores;
