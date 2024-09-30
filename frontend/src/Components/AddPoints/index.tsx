import React, { useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { Table, Form, Container, Col, Row, Button } from "react-bootstrap";
import LeagueButton from "../shared/LeagueButton";
import "../../CSS/LeaguePages.css";
import { useUpdateTeamsMutation } from "../../hooks/query/useUpdateTeamsMutation";
import { useLeagueScoringData } from "../../hooks/useLeagueScoringData";

export default function AddPoints() {
  const { id } = useParams() as { id: string };
  const { league, week, setWeek, teams, setTeams } = useLeagueScoringData(id);
  const [redirect, setRedirect] = useState(false);
  const { mutate: sendUpdate } = useUpdateTeamsMutation(id, teams);

  const handleAddedPoints = (
    e: React.ChangeEvent<HTMLSelectElement>,
    index: number
  ) => {
    const tempTeams = [...teams];
    tempTeams[index].weekInfo[week].addedPoints = parseInt(e.target.value);
    setTeams(tempTeams);
  };

  const updateTeams = () => {
    sendUpdate();
    setRedirect(true);
  };

  if (redirect) {
    return <Navigate to={`/league/${id}/`} />;
  }
  return (
    <Container className="mt-3">
      <LeagueButton id={id} />
      <Row className="mt-3 mb-3">
        <Col className="justify-items-center align-self-center" md={1}>
          <Form.Label>Week: </Form.Label>
        </Col>
        <Col md={1}>
          <Form.Control
            as="select"
            value={week}
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
      <Row>
        <Col>
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
                  return (
                    <tr key={i}>
                      <td>{team.name}</td>
                      <td>
                        {(team.weekInfo[week].weekScore || 0).toFixed(2)}
                      </td>
                      <td>
                        <Form.Control
                          value={team.weekInfo[week].addedPoints || 0}
                          onChange={(
                            e: React.ChangeEvent<HTMLSelectElement>
                          ) => handleAddedPoints(e, i)}
                          type="text"
                        />
                      </td>
                    </tr>
                  );
                })
                : null}
            </tbody>
          </Table>
        </Col>
      </Row>
      <Button variant="success" className="mt-5 mb-5" onClick={updateTeams}>
        Submit
      </Button>
    </Container>
  );
}
