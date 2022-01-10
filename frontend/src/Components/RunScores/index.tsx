import React, { useState, useEffect } from "react";
import { useParams, Redirect } from "react-router-dom";
import { Container, Button, Row, Toast } from "react-bootstrap";
import LeagueButton from "../shared/LeagueButton";
import ScorePlacementTable from "./ScorePlacementTable";
import TeamScoringBreakdown from "./TeamScoringBreakdown";
import ErrorTable from "./ErrorTable";
import EditWeek from "../shared/EditWeek";
import { auth } from "../../firebase-config";
import "../../CSS/LeaguePages.css";
import { Team, League, ScoringError } from "@ff-mern/ff-types";

type ApiResponse = {
  teams: Team[];
  league: League;
};

const RunScores = () => {
  const { id } = useParams<{ id: string }>();
  const [teams, setTeams] = useState<Team[]>([]);
  const [league, setLeague] = useState<League | null>(null);
  const [isCommissioner, setIsCommissioner] = useState(false);
  const [week, setWeek] = useState(1);
  const [errors, setErrors] = useState([]);

  const [loading, setLoading] = useState(false);
  const [redirect, setRedirect] = useState(false);
  const [show, setShow] = useState(false);
  const [popupText, setText] = useState("");
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      const url = `${process.env.REACT_APP_PUBLIC_URL}/api/v1/league/${id}/`;
      const resp = await fetch(url);
      const json = (await resp.json()) as ApiResponse;
      setTeams(json.teams);
      setLeague(json.league);
      setWeek(json.league.lastScoredWeek + 1 || 1);
      setIsCommissioner(json.league.commissioners.includes(user!.uid));
    });
    return () => unsub();
  }, [id]);
  const sendData = () => {
    setLoading(true);
    const url = `${process.env.REACT_APP_PUBLIC_URL}/api/v1/league/${id}/runScores/`;
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
  const handleFix = async (error: ScoringError, ind: number) => {
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
        const resp = await fetch(
          `${process.env.REACT_APP_PUBLIC_URL}/api/v1/league/updateTeams`,
          reqDict
        );
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
      {league && (
        <EditWeek
          week={week}
          maxWeeks={league?.numWeeks}
          onChange={(e) => setWeek(parseInt(e.target.value))}
        />
      )}
      {teams.length > 0 &&
        league &&
        teams.map((team, i) => (
          <TeamScoringBreakdown
            key={i}
            league={league!.scoringSettings}
            team={team}
            week={week}
          />
        ))}
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
