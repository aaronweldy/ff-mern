import React, { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { Container, Button, Row, Toast, Col } from "react-bootstrap";
import LeagueButton from "../shared/LeagueButton";
import ScorePlacementTable from "./ScorePlacementTable";
import TeamScoringBreakdown from "./TeamScoringBreakdown";
import ErrorTable from "./ErrorTable";
import EditWeek from "../shared/EditWeek";
import "../../CSS/LeaguePages.css";
import { ScoringError } from "@ff-mern/ff-types";
import { useLeagueScoringData } from "../../hooks/useLeagueScoringData";
import {
  ScoringToggleType,
  StatTypeToggleButton,
} from "../shared/StatTypeToggleButton";
import { useRunScoresMutation } from "../../hooks/query/useRunScoresMutation";
import { useUpdateTeamsMutation } from "../../hooks/query/useUpdateTeamsMutation";

const RunScores = () => {
  const { id } = useParams() as { id: string };
  const { league, teams, week, setWeek, playerData } = useLeagueScoringData(id);
  const [errors, setErrors] = useState<ScoringError[]>([]);
  const [redirect, setRedirect] = useState(false);
  const [show, setShow] = useState(false);
  const [popupText, setText] = useState("");
  const [selectedDisplay, setDisplay] = useState<ScoringToggleType>("scoring");
  const { mutate: runScores, isLoading } = useRunScoresMutation(
    id,
    week || 1,
    teams
  );
  const { mutate: updateTeams } = useUpdateTeamsMutation(id, teams);
  const handleFix = async (error: ScoringError, ind: number) => {
    if (!teams) {
      return;
    }
    switch (error.type) {
      case "NOT FOUND":
        setErrors((oldErrors) => {
          oldErrors.splice(ind, 1);
          return oldErrors;
        });
        setRedirect(true);
        break;
      case "POSSIBLE BACKUP": {
        const teamInd = teams.findIndex((check) => check.id === error.team.id);
        const info = teams[teamInd].weekInfo[week || 1];
        const playerInd = info.finalizedLineup[error.player.position].findIndex(
          (check) => check.name === error.player.name
        );
        const backupInd = info.finalizedLineup.bench.findIndex(
          (check) => check.name === error.player.backup
        );
        const backupPlayer = info.finalizedLineup.bench[backupInd];
        backupPlayer.lineup = error.player.lineup;
        info.finalizedLineup[error.player.position].splice(
          playerInd,
          1,
          backupPlayer
        );
        error.player.lineup = "bench";
        info.finalizedLineup.bench.splice(backupInd, 1, error.player);
        updateTeams();
        setErrors((oldErrors) => {
          oldErrors.splice(ind, 1);
          return oldErrors;
        });
        setText(
          `Replaced ${error.player.name} with ${error.player.backup}. Rerun scores to finalize.`
        );
        setShow(true);
        break;
      }
      default:
        setRedirect(true);
    }
  };

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplay(e.target.value as ScoringToggleType);
  };

  if (redirect) {
    return <Navigate to={`/league/${id}/editTeams/`} />;
  }
  return (
    <Container fluid className="pl-5">
      <Row>
        <LeagueButton id={id} />
      </Row>
      <Row>
        <Col className="mt-3">
          Display:{" "}
          <StatTypeToggleButton
            selected={selectedDisplay}
            onChange={handleToggle}
          />
        </Col>
      </Row>
      {league && teams && (
        <EditWeek
          week={week || 1}
          maxWeeks={league?.numWeeks}
          onChange={(e) => setWeek(parseInt(e.target.value))}
        />
      )}
      {league &&
        teams &&
        playerData &&
        teams.map((team, i) => (
          <TeamScoringBreakdown
            key={i}
            leagueScoringCategories={league.scoringSettings}
            team={team}
            week={week || 1}
            playerData={playerData.players}
            dataDisplay={selectedDisplay}
          />
        ))}
      {teams && (
        <Row>
          <ScorePlacementTable teams={teams} week={week || 1} />
        </Row>
      )}
      <>
        <Row>
          <ErrorTable errors={errors} handleFix={handleFix} />
        </Row>
        <Row className="mb-3">
          <Button variant="success" onClick={() => runScores()}>
            Calculate Scores
          </Button>
        </Row>
      </>
      {isLoading ? <div className="spinning-loader" /> : ""}
      <Toast
        show={show}
        onClose={() => setShow(false)}
        className="centered-popup"
        delay={7500}
        autohide
      >
        <Toast.Header>Error resolution</Toast.Header>
        <Toast.Body>{popupText}</Toast.Body>
      </Toast>
    </Container>
  );
};

export default RunScores;
