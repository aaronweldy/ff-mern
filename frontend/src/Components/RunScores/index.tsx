import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Container, Button, Row, Col, Alert } from "react-bootstrap";
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
  console.log(playerData);
  const [selectedTeamId, setSelectedTeamId] = useState<string>();
  const { team: selectedTeam, isLoading: teamLoading } =
    useSingleTeam(selectedTeamId);
  const [selectedDisplay, setDisplay] = useState<ScoringToggleType>("scoring");
  const {
    mutate: runScores,
    isLoading: scoresLoading,
    data: scoringResult,
    error: scoringError,
  } = useRunScoresMutation(id, week || 1, teams);
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
    <Container fluid className="league-page scores-page">
      <Row className="mt-2">
        <Col>
          <LeagueButton id={id} />
        </Col>
      </Row>
      <h1 className="h3 mt-3">Weekly scores</h1>
      <div className="scores-controls">
        <div className="score-display-toggle">
          <span className="mr-3">Display:</span>
          <StatTypeToggleButton
            selected={selectedDisplay}
            onChange={handleToggle}
          />
        </div>
        <EditWeek
          week={week || 1}
          maxWeeks={league?.numWeeks}
          onChange={(e) => setWeek(parseInt(e.target.value))}
        />
        {teams.length > 0 && (
          <div className="score-team-select">
            <span className="d-block mb-1">Team</span>
            <TeamSelectionDropdown
              teams={teams}
              selectedTeam={selectedTeamId}
              updateTeam={updateSelectedTeam}
            />
          </div>
        )}
      </div>
      {league && teams && playerData && selectedTeam && (
        <>
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
          <Button
            variant="success"
            disabled={scoresLoading}
            onClick={() => runScores()}
          >
            Calculate Scores
          </Button>
        </Col>
      </Row>
      {scoringError && <Alert variant="danger">{scoringError.message}</Alert>}
      {!!scoringResult?.errors.length && (
        <Alert variant="warning">
          <p>Scores saved with the following warnings:</p>
          <ul>
            {scoringResult.errors.map((warning, index) => (
              <li key={index}>
                {warning.team.name}: {warning.desc}
              </li>
            ))}
          </ul>
        </Alert>
      )}
      {dataLoading ? <div className="spinning-loader" /> : ""}
    </Container>
  );
};

export default RunScores;
