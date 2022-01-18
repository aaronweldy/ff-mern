import React, { useState } from "react";
import { useParams, Redirect } from "react-router-dom";
import { Container, Button, Row, Toast } from "react-bootstrap";
import LeagueButton from "../shared/LeagueButton";
import ScorePlacementTable from "./ScorePlacementTable";
import TeamScoringBreakdown from "./TeamScoringBreakdown";
import ErrorTable from "./ErrorTable";
import EditWeek from "../shared/EditWeek";
import "../../CSS/LeaguePages.css";
import { ScoringError } from "@ff-mern/ff-types";
import { API } from "@ff-mern/ff-types";
import { useLeagueScoringData } from "../../hooks/useLeagueScoringData";

const RunScores = () => {
  const { id } = useParams<{ id: string }>();
  const {
    league,
    teams,
    setTeams,
    week,
    setWeek,
    playerData,
    setPlayerData,
    isCommissioner,
  } = useLeagueScoringData(id);
  const [errors, setErrors] = useState<ScoringError[]>([]);
  const [loading, setLoading] = useState(false);
  const [redirect, setRedirect] = useState(false);
  const [show, setShow] = useState(false);
  const [popupText, setText] = useState("");

  const sendData = () => {
    setLoading(true);
    const sendWeek = week || 1;
    API.runScores(id, sendWeek, teams).then((data) => {
      setTeams(data.teams);
      setErrors(data.errors);
      setPlayerData(data.data);
      setLoading(false);
    });
  };
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
        API.updateTeams([...teams]).then((data) => {
          setTeams(data);
          setErrors((oldErrors) => {
            oldErrors.splice(ind, 1);
            return oldErrors;
          });
          setText(
            `Replaced ${error.player.name} with ${error.player.backup}. Rerun scores to finalize.`
          );
          setShow(true);
        });
        break;
      }
      default:
        setRedirect(true);
    }
  };

  if (redirect) {
    return <Redirect to={`/league/${id}/editTeams/`} />;
  }
  return (
    <Container className="ml-5">
      <Row>
        <LeagueButton id={id} />
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
            league={league.scoringSettings}
            team={team}
            week={week || 1}
            playerData={playerData}
          />
        ))}
      {teams && (
        <Row>
          <ScorePlacementTable teams={teams} week={week || 1} />
        </Row>
      )}
      {isCommissioner ? (
        <>
          <Row>
            <ErrorTable errors={errors} handleFix={handleFix} />
          </Row>
          <Row className="mb-3">
            <Button variant="success" onClick={sendData}>
              Calculate Scores
            </Button>
          </Row>
        </>
      ) : (
        ""
      )}
      {loading ? <div className="spinning-loader" /> : ""}
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
