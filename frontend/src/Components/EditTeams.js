import React, { useState, useEffect } from "react";
import { Redirect, useParams } from "react-router-dom";
import {
  Table,
  Container,
  Col,
  Form,
  Button,
  Row,
  OverlayTrigger,
} from "react-bootstrap";
import { Typeahead } from 'react-bootstrap-typeahead';
import LeagueButton from "./LeagueButton";
import { usePlayers } from '../hooks/usePlayers';
import { auth } from "../firebase-config";
import 'react-bootstrap-typeahead/css/Typeahead.css';

const EditTeams = () => {
  const [teams, setTeams] = useState(null);
  const [redirect, setRedirect] = useState(false);
  const { id } = useParams();
  const { players } = usePlayers();
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const url = `${process.env.REACT_APP_PUBLIC_URL}/api/v1/league/${id}/`;
        const data = await fetch(url);
        const json = await data.json();
        const isComm = json.league.commissioners.includes(user.uid);
        if (!isComm) setRedirect(true);
        setTeams(json.teams);
      }
    });
    return () => unsub();
  }, [id]);
  const handleAddPlayer = (e) => {
    const tempTeams = [...teams];
    tempTeams[e.target.dataset.id].players.push({
      name: "",
      position: "QB",
      lineup: [...Array(18).fill("bench")],
      points: [...Array(18).fill(0)],
      weekStats: [...Array(18).fill(0)],
      backup: [...Array(18).fill("None")],
    });
    setTeams(tempTeams);
  };

  const handlePlayerChange = (e) => {
    const tempTeams = [...teams];
    if (e.target.name === "remove") {
      tempTeams[e.target.dataset.team].players.splice(e.target.dataset.id, 1);
    } else {
      tempTeams[e.target.dataset.team].players[e.target.dataset.id][
        e.target.name
      ] = e.target.value;
    }
    setTeams(tempTeams);
  };

  const handleInfoChange = (e) => {
    const tempTeams = [...teams];
    tempTeams[e.target.dataset.id][e.target.name] = e.target.value;
    setTeams(tempTeams);
  };

  const handleNameChange = (team, player, newName) => {
    const tempTeams = [...teams];
    tempTeams[team].players[player].name = newName;
    setTeams(tempTeams);
  }

  const sendUpdatedTeams = () => {
    const url = `${process.env.REACT_APP_PUBLIC_URL}/api/v1/league/updateTeams/`;
    const body = { teams };
    const reqdict = {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    };
    fetch(url, reqdict).then(() => setRedirect(true));
  };
  if (redirect) return <Redirect to={`/league/${id}/`} />;
  return (
    <Container fluid>
      <Row className="justify-content-center">
        <LeagueButton id={id} />
      </Row>
      <Row className="justify-content-center">
        {teams
          ? teams.map((team, i) => (
              <Col md={4} key={i} className="bordered-row m-3 p-3">
                <Form.Group as={Row} className="mt-3">
                  <Form.Label column md={4}>
                    Team Name
                  </Form.Label>
                  <Col md={8}>
                    <Form.Control
                      data-id={i}
                      name="name"
                      onChange={handleInfoChange}
                      size="lg"
                      type="text"
                      value={team.name}
                    />
                  </Col>
                </Form.Group>
                <Row className="mb-2">
                  <Form.Label column md={4}>
                    Team Owner
                  </Form.Label>
                  <Col md={8}>
                    <Form.Control
                      data-id={i}
                      name="ownerName"
                      onChange={handleInfoChange}
                      size="md"
                      type="text"
                      value={team.ownerName}
                    />
                  </Col>
                </Row>
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Position</th>
                      <th>Player Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {team.players.map((player, j) => (
                      <OverlayTrigger
                        key={j}
                        placement="left"
                        delay="1000"
                        overlay={
                          <Button
                            onClick={handlePlayerChange}
                            name="remove"
                            variant="danger"
                            data-team={i}
                            data-id={j}
                          >
                            X
                          </Button>
                        }
                      >
                        <tr>
                          <td>
                            <Form.Control
                              name="position"
                              data-team={i}
                              data-id={j}
                              as="select"
                              value={player.position}
                              onChange={handlePlayerChange}
                            >
                              <option value="QB">QB</option>
                              <option value="RB">RB</option>
                              <option value="WR">WR</option>
                              <option value="TE">TE</option>
                              <option value="K">K</option>
                            </Form.Control>
                          </td>
                          <td>
                            <Typeahead
                              type="text"
                              id="player-typeahead"
                              selected={player.name ? [player.name] : []}
                              options={players}
                              placeholder="Select Player"
                              onChange={(selected) => handleNameChange(i, j, selected[0])}
                            />
                          </td>
                        </tr>
                      </OverlayTrigger>
                    ))}
                  </tbody>
                </Table>
                <Row className="justify-content-center mb-2">
                  <Button
                    data-id={i}
                    onClick={handleAddPlayer}
                    variant="primary"
                  >
                    Add Player
                  </Button>
                </Row>
              </Col>
            ))
          : ""}
      </Row>
      <Row className="justify-content-center m-5">
        <Button onClick={sendUpdatedTeams} variant="success">
          Submit Teams
        </Button>
      </Row>
    </Container>
  );
};

export default EditTeams;
