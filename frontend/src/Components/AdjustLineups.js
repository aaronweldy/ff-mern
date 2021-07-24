import React, { useState, useEffect } from "react";
import { Redirect, useParams } from "react-router-dom";
import { Alert, Container, Col, Row, Button } from "react-bootstrap";
import { auth } from "../firebase-config";
import LeagueButton from "./LeagueButton";
import TeamTable from "./TeamTable";
import EditWeek from "./EditWeek";
import { lineupSorter } from "../constants.js";
import { useLeague } from "../hooks/useLeague";
import "../CSS/LeaguePages.css";

export default function AdjustLineups() {
  const { id } = useParams();
  const { league, teams: initTeams } = useLeague(id);
  const [teams, setTeams] = useState([]);
  const [success, setSuccess] = useState(false);
  const [week, setWeek] = useState(1);
  const currUser = auth.currentUser;
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(() => {
      if (league) {
        setWeek(league.lastWeekScored || 1);
        setTeams(initTeams);
      }
    });
    return () => unsub();
  }, [league, initTeams]);
  const handlePlayerChange = (selectedPlayer, name, swapPlayer) => {
    if (name === "starters") {
      swapPlayer.lineup[week] = selectedPlayer.lineup[week];
      selectedPlayer.lineup[week] = "bench";
    } else if (name === "backup") {
      if (swapPlayer.name === "none") {
        selectedPlayer.backup[week] = null;
      } else {
        selectedPlayer.backup[week] = swapPlayer.name;
      }
    } else {
      selectedPlayer.lineup[week] = swapPlayer.lineup[week];
      if (swapPlayer.name !== "") {
        swapPlayer.lineup[week] = "bench";
      }
    }
    setTeams([...teams]);
  };
  const handleBenchPlayer = (selectedPlayer) => {
    const tempTeams = [...teams];
    selectedPlayer.lineup[week] = "bench";
    setTeams(tempTeams);
  };
  const submitLineups = () => {
    const tempTeams = [...teams];
    for (const team of tempTeams) {
      team.players = team.players.filter((player) => player.name !== "");
    }
    const url = "/api/v1/league/updateTeams/";
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
  if (teams && teams.length && !league.commissioners.includes(currUser.uid))
    return <Redirect to={`/league/${id}/`} />;
  return (
    <Container id="small-left">
      <LeagueButton id={id} />
      <EditWeek
        week={week}
        onChange={(e) => setWeek(parseInt(e.target.value))}
      />
      {teams
        ? teams.map((team, i) => {
            const starters = Object.keys(league && league.lineupSettings)
              .sort(lineupSorter)
              .map((pos) => [
                ...Array(parseInt(league && league.lineupSettings[pos]))
                  .fill()
                  .map(() => ({
                    position: pos,
                    name: "",
                    lineup: [...Array(17).fill(pos)],
                  })),
              ])
              .flat();
            team.players
              .filter((player) => player.lineup[week] !== "bench")
              .forEach((starter) => {
                starters[
                  starters.findIndex(
                    (player) =>
                      player.lineup[week] === starter.lineup[week] &&
                      player.name === ""
                  )
                ] = starter;
              });
            const bench = team.players.filter(
              (player) => player.lineup[week] === "bench"
            );
            return (
              <Row key={i}>
                <Col xs={12}>
                  <h2>{team.name}</h2>
                </Col>
                <Col xs={12}>
                  <h4>Starters</h4>
                </Col>
                <Col>
                  <TeamTable
                    players={starters}
                    week={week}
                    oppPlayers={bench}
                    name="starters"
                    handleBenchPlayer={handleBenchPlayer}
                    handlePlayerChange={handlePlayerChange}
                    isOwner
                  />
                  <div>
                    <h4>Bench</h4>
                  </div>
                  <TeamTable
                    players={bench}
                    week={week}
                    oppPlayers={starters}
                    name="bench"
                    handleBenchPlayer={handleBenchPlayer}
                    handlePlayerChange={handlePlayerChange}
                    isOwner
                  />
                </Col>
              </Row>
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
