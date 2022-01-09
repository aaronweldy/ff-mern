import React, { useState, useEffect } from "react";
import { Redirect, useParams } from "react-router-dom";
import { Table, Form, Container, Col, Row, Button } from "react-bootstrap";
import { auth } from "../../firebase-config";
import { useLeague } from "../../hooks/useLeague";
import LeagueButton from "../shared/LeagueButton";
import "../../CSS/LeaguePages.css";
import { Team } from "../../ff-types/Team";

export default function AddPoints() {
  const { id } = useParams<{ id: string }>();
  const { league, teams: initTeams } = useLeague(id);
  const [teams, setTeams] = useState<Team[]>([]);
  const [week, setWeek] = useState(1);
  const [redirect, setRedirect] = useState(false);

  const user = auth.currentUser;
  console.log(initTeams);
  useEffect(() => {
    if (initTeams.length) {
      setTeams(initTeams);
    }
  }, [initTeams]);
  const handleAddedPoints = (
    e: React.ChangeEvent<HTMLSelectElement>,
    index: number
  ) => {
    const tempTeams = [...teams];
    tempTeams[index].addedPoints[week] = parseInt(e.target.value);
    setTeams(tempTeams);
  };
  const updateTeams = () => {
    teams.forEach((team) => {
      team.addedPoints = team.addedPoints.map((pts) =>
        typeof pts === "string" ? Number.parseFloat(pts) || 0 : pts
      );
    });
    const body = { teams };
    const url = `${process.env.REACT_APP_PUBLIC_URL}/api/v1/league/adjustTeamSettings/`;
    const reqDict = {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    };
    fetch(url, reqDict);
    setRedirect(true);
  };

  useEffect(() => {
    if (league) {
      setWeek(league.lastScoredWeek + 1 || 1);
    }
  }, [league]);

  if (
    (teams.length > 0 && !league!.commissioners.includes(user!.uid)) ||
    redirect
  ) {
    return <Redirect to={`/league/${id}/`} />;
  }
  return (
    <Container id="small-left">
      <Row>
        <LeagueButton id={id} />
      </Row>
      <Row className="mt-3 mb-3">
        <Col className="justify-items-center align-self-center" md={1}>
          <Form.Label>Week: </Form.Label>
        </Col>
        <Col md={1}>
          <Form.Control
            as="select"
            defaultValue={week}
            onChange={(e) => setWeek(parseInt(e.target.value))}
          >
            {[...Array((league && league.numWeeks) || 18)].map((_, i) => (
              <option value={i + 1} key={i}>
                {i + 1}
              </option>
            ))}
          </Form.Control>
        </Col>
      </Row>
      <Table bordered>
        <thead>
          <tr>
            <th>Team Name</th>
            <th>Points in Week</th>
            <th>Points to Add</th>
          </tr>
        </thead>
        <tbody>
          {teams && league
            ? teams.map((team, i) => {
                if (team.addedPoints.length === 0) {
                  team.addedPoints = [...Array(league.numWeeks + 1)].fill(0);
                }
                return (
                  <tr key={i}>
                    <td>{team.name}</td>
                    <td>{(team.weekScores[week] || 0).toFixed(2)}</td>
                    <td>
                      <Form.Control
                        value={team.addedPoints[week] || 0}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          handleAddedPoints(e, i)
                        }
                        type="text"
                      />
                    </td>
                  </tr>
                );
              })
            : ""}
        </tbody>
      </Table>
      <Button variant="success" className="mt-5 mb-5" onClick={updateTeams}>
        Submit
      </Button>
    </Container>
  );
}
