import React, { useState, useEffect } from "react";
import { useParams, Redirect } from "react-router-dom";
import LeagueButton from "./LeagueButton";
import ScorePlacementTable from "./ScorePlacementTable";
import TeamScoringBreakdown from "./TeamScoringBreakdown";
import ErrorTable from "./ErrorTable";
import EditWeek from "./EditWeek";
import { Container, Button, Row, Toast } from "react-bootstrap";
import { auth } from "../firebase-config";
import "../CSS/LeaguePages.css";

const RunScores = () => {
  const { id } = useParams();
  const [teams, setTeams] = useState([]);
  const [league, setLeague] = useState(null);
  const [isCommissioner, setIsCommissioner] = useState(false);
  const [week, setWeek] = useState(1);
  const [errors, setErrors] = useState([]);

  const [loading, setLoading] = useState(false);
  const [redirect, setRedirect] = useState(false);
  const [show, setShow] = useState(false);
  const [popupText, setText] = useState("");
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      const url = `/api/v1/league/${id}/`;
      const resp = await fetch(url);
      const json = await resp.json();
      console.log(json);
      setTeams(json.teams);
      setLeague(json.league.scoringSettings);
      setIsCommissioner(json.league.commissioners.includes(user.uid));
    });
    return () => unsub();
  }, [id]);
  const sendData = (_) => {
    setLoading(true);
    const url = `/api/v1/league/${id}/runScores/`;
    const body = { week };
    const reqDict = {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    };
    fetch(url, reqDict)
      .then((resp) => resp.json())
      .then((data) => {
        setTeams(data.teams);
        setErrors(data.errors);
        setLoading(false);
      });
  };
  const handleFix = async (error, ind) => {
    switch (error.type) {
      case "e":
        setErrors((oldErrors) => {
          oldErrors.splice(ind, 1);
          return oldErrors;
        });
        setRedirect(true);
        break;
      case "b":
        const teamInd = teams.findIndex((check) => check.id === error.team.id);
        const playerInd = error.team.players.findIndex(
          (check) => check.name === error.player.name
        );
        const backupInd = error.team.players.findIndex(
          (check) => check.name === error.player.backup[week]
        );
        teams[teamInd].players[backupInd].lineup[week] =
          error.player.lineup[week];
        teams[teamInd].players[playerInd].lineup[week] = "bench";
        const body = {
          teams,
        };
        const reqDict = {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        };
        const resp = await fetch("/api/v1/league/updateTeams", reqDict);
        const data = await resp.json();
        setTeams(data.teams);
        setErrors((oldErrors) => {
          oldErrors.splice(ind, 1);
          return oldErrors;
        });
        setText(
          `Replaced ${error.player.name} with ${error.player.backup[week]}. Rerun scores to finalize.`
        );
        setShow(true);
        break;
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
        <LeagueButton id={id}></LeagueButton>
      </Row>
      <EditWeek
        week={week}
        onChange={(e) => setWeek(parseInt(e.target.value))}
      />
      {teams.length > 0
        ? teams.map((team, i) => {
            return (
              <TeamScoringBreakdown
                key={i}
                league={league}
                team={team}
                week={week}
              />
            );
          })
        : ""}
      <Row>
        <ScorePlacementTable teams={teams} week={week} />
      </Row>
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
      {loading ? <div className="spinning-loader"></div> : ""}
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
