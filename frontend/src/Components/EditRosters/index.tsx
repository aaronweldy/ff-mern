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
import { Typeahead } from "react-bootstrap-typeahead";
import LeagueButton from "../shared/LeagueButton";
import { usePlayers } from "../../hooks/usePlayers";
import { auth } from "../../firebase-config";
import "react-bootstrap-typeahead/css/Typeahead.css";
import { Team, RosteredPlayer, AbbreviatedNflTeam } from "@ff-mern/ff-types";
import { capitalizePlayerName } from "../utils/capitalizePlayerName";
import { API } from "../../API";

const EditRosters = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [redirect, setRedirect] = useState(false);
  const { id } = useParams<{ id: string }>();
  const players = usePlayers();
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const json = await API.fetchLeague(id);
        const isComm = json.league.commissioners.includes(user.uid);
        if (!isComm) {
          setRedirect(true);
        }
        setTeams(json.teams);
      }
    });
    return () => unsub();
  }, [id]);
  const handleAddPlayer = (idx: number) => {
    const tempTeams = [...teams];
    tempTeams[idx].rosteredPlayers.push(
      new RosteredPlayer("", "" as AbbreviatedNflTeam, "QB")
    );
    setTeams(tempTeams);
  };

  const handleRemovePlayer = (
    e: React.MouseEvent<HTMLElement, MouseEvent>,
    teamIdx: number,
    playerIdx: number
  ) => {
    const tempTeams = [...teams];
    tempTeams[teamIdx].rosteredPlayers.splice(playerIdx, 1);
    setTeams(tempTeams);
  };

  const handleInfoChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    name: string,
    idx: number
  ) => {
    const tempTeams = [...teams];
    switch (name) {
      case "name":
        tempTeams[idx].name = e.target.value;
        break;
      case "ownerName":
        tempTeams[idx].ownerName = e.target.value;
        break;
      case "position":
        tempTeams[idx].ownerName = e.target.value;
        break;
    }
    setTeams(tempTeams);
  };

  const handleInputChange = (team: number, player: number, input: string) => {
    const tempTeams = [...teams];
    tempTeams[team].rosteredPlayers[player].name = input;
    setTeams(tempTeams);
  };

  const handleSelectPlayer = (
    team: number,
    player: number,
    selected: RosteredPlayer[]
  ) => {
    if (selected.length === 1) {
      const tempTeams = [...teams];
      tempTeams[team].rosteredPlayers[player] = selected[0];
      setTeams(tempTeams);
    }
  };

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
  if (redirect) {
    return <Redirect to={`/league/${id}/`} />;
  }
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
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleInfoChange(e, "name", i)
                      }
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
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleInfoChange(e, "ownerName", i)
                      }
                      size="sm"
                      type="text"
                      value={team.ownerName}
                    />
                  </Col>
                </Row>
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th className="centered-td">Position</th>
                      <th className="centered-td">Player Name</th>
                      <th className="centered-td">Team</th>
                    </tr>
                  </thead>
                  <tbody>
                    {team.rosteredPlayers.map((player, j) => (
                      <OverlayTrigger
                        key={j}
                        placement="left"
                        delay={1000}
                        overlay={
                          <Button
                            onClick={(e) => handleRemovePlayer(e, i, j)}
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
                          <td className="centered-td align-middle">
                            {player.position}
                          </td>
                          <td>
                            <Typeahead
                              id="player-typeahead"
                              selected={[player]}
                              options={players || []}
                              placeholder="Select Player"
                              onInputChange={(input) =>
                                handleInputChange(i, j, input)
                              }
                              onChange={(selected) =>
                                handleSelectPlayer(i, j, selected)
                              }
                              labelKey={(player) =>
                                player.name
                                  ? capitalizePlayerName(player.name)
                                  : ""
                              }
                            />
                          </td>
                          <td className="centered-td align-middle">
                            {player.team}
                          </td>
                        </tr>
                      </OverlayTrigger>
                    ))}
                  </tbody>
                </Table>
                <Row className="justify-content-center mb-2">
                  <Button onClick={() => handleAddPlayer(i)} variant="primary">
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

export default EditRosters;
