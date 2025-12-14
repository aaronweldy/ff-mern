import {
  AbbreviatedNflTeam,
  AbbreviationToFullTeam,
  RosteredPlayer,
  setPlayerName,
  SinglePosition,
  singlePositionTypes,
} from "@ff-mern/ff-types";
import React, { useState } from "react";
import {
  Button,
  Card,
  Col,
  Container,
  Form,
  OverlayTrigger,
  Row,
  Table,
} from "react-bootstrap";
import { Typeahead as RBTypeahead, TypeaheadModel, TypeaheadProps } from "react-bootstrap-typeahead";
import "react-bootstrap-typeahead/css/Typeahead.css";
import { Navigate, useParams } from "react-router-dom";
import { useAddPlayerToGlobalMutation } from "../../hooks/query/useAddPlayerToGlobalMutation";
import { usePlayers } from "../../hooks/query/usePlayers";
import { useResetRostersMutation } from "../../hooks/query/useResetRostersMutation";
import { useSyncPlayersMutation } from "../../hooks/query/useSyncPlayersMutation";
import { useTeams } from "../../hooks/query/useTeams";
import { useUpdateTeamsMutation } from "../../hooks/query/useUpdateTeamsMutation";
import { ConfirmationModal } from "../shared/ConfirmationModal";
import { InlineTeamTile } from "../shared/InlineTeamTile";
import LeagueButton from "../shared/LeagueButton";
import styles from "./EditRosters.module.css";

const Typeahead = RBTypeahead as unknown as <T extends TypeaheadModel>(props: TypeaheadProps<T>) => JSX.Element;

const nflTeams = Object.keys(AbbreviationToFullTeam) as AbbreviatedNflTeam[];

const EditRosters = () => {
  const [show, setShow] = useState(false);
  const [showSyncConfirm, setShowSyncConfirm] = useState(false);
  const [redirect, setRedirect] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerTeam, setNewPlayerTeam] = useState<AbbreviatedNflTeam>("ARI");
  const [newPlayerPosition, setNewPlayerPosition] = useState<SinglePosition>("QB");
  const { id } = useParams() as { id: string };
  const { teams, setTeams, query: teamsQuery } = useTeams(id);
  const { mutate: validateTeams } = useUpdateTeamsMutation(id, teams, true);
  const playersQuery = usePlayers();
  const resetRosters = useResetRostersMutation(id);
  const syncPlayers = useSyncPlayersMutation();
  const addPlayerToGlobal = useAddPlayerToGlobalMutation();
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
    setPlayerName(tempTeams[team].rosteredPlayers[player], input);
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
    validateTeams();
    setRedirect(true);
  };

  const onResetConfirm = () => {
    resetRosters.mutate();
    setShow(false);
  };

  const onSyncConfirm = () => {
    syncPlayers.mutate();
    setShowSyncConfirm(false);
  };

  const handleAddPlayerToGlobal = () => {
    if (!newPlayerName.trim()) return;
    addPlayerToGlobal.mutate({
      fullName: newPlayerName.trim(),
      team: newPlayerTeam,
      position: newPlayerPosition,
    });
    setNewPlayerName("");
  };

  if (redirect) {
    return <Navigate to={`/league/${id}/`} />;
  } else if (
    teamsQuery.isLoading ||
    playersQuery.isLoading ||
    resetRosters.isLoading ||
    syncPlayers.isLoading ||
    addPlayerToGlobal.isLoading
  ) {
    return <div className="spinning-loader" />;
  }
  return (
    <Container fluid className="mt-3">
      <ConfirmationModal
        show={show}
        onHide={() => setShow(false)}
        title="Reset All Rosters"
        onConfirm={onResetConfirm}
      />
      <ConfirmationModal
        show={showSyncConfirm}
        onHide={() => setShowSyncConfirm(false)}
        title="Sync Global Players"
        onConfirm={onSyncConfirm}
      />
      <Row className="justify-content-center">
        <Col md={8}>
          <LeagueButton id={id} />
          <Button
            className="mt-3"
            variant="outline-danger"
            onClick={() => setShow(true)}
          >
            Reset All Rosters
          </Button>
          <Card className="mt-3 mb-3">
            <Card.Header>Global Players Database</Card.Header>
            <Card.Body>
              <Row className="align-items-end mb-3">
                <Col md={12}>
                  <Button
                    variant="outline-primary"
                    onClick={() => setShowSyncConfirm(true)}
                  >
                    Sync Global Players from Web
                  </Button>
                  <Form.Text className="ms-2 text-muted">
                    Re-fetches all players from FantasyPros depth charts
                  </Form.Text>
                </Col>
              </Row>
              <hr />
              <Form.Label>Add Player to Global Database</Form.Label>
              <Row className="align-items-center justify-content-center">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Player Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter player name"
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Position</Form.Label>
                    <Form.Control as="select"
                      value={newPlayerPosition}
                      onChange={(e) => setNewPlayerPosition(e.target.value as SinglePosition)}
                    >
                      {singlePositionTypes.map((pos) => (
                        <option key={pos} value={pos}>
                          {pos}
                        </option>
                      ))}
                    </Form.Control>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>NFL Team</Form.Label>
                    <Form.Control as="select"
                      value={newPlayerTeam}
                      onChange={(e) => setNewPlayerTeam(e.target.value as AbbreviatedNflTeam)}
                    >
                      {nflTeams.map((team) => (
                        <option key={team} value={team}>
                          {team}
                        </option>
                      ))}
                    </Form.Control>
                  </Form.Group>
                </Col>
                <Col md={2} className="d-flex justify-content-center align-items-center">
                  <Button
                    variant="success"
                    onClick={handleAddPlayerToGlobal}
                    disabled={!newPlayerName.trim()}
                  >
                    Add Player
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
          <Row>
            {teamsQuery.isSuccess
              ? teams.map((team, i) => (
                <Col
                  md={5}
                  key={i}
                  className={`${styles["bordered-row"]} m-3 p-3`}
                >
                  <Form.Group as={Row} className="mt-3">
                    <Form.Label column md={4}>
                      Team Name
                    </Form.Label>
                    <Col md={8}>
                      <Form.Control
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleInfoChange(e, "name", i)
                        }
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
                                options={
                                  (playersQuery.isSuccess &&
                                    playersQuery.data.players) ||
                                  []
                                }
                                placeholder="Select Player"
                                onInputChange={(input) =>
                                  handleInputChange(i, j, input)
                                }
                                onChange={(selected) =>
                                  handleSelectPlayer(i, j, selected)
                                }
                                labelKey={(player) => player.fullName ?? ""}
                              />
                            </td>
                            <td className="centered-td align-middle">
                              <InlineTeamTile team={player.team} />
                            </td>
                          </tr>
                        </OverlayTrigger>
                      ))}
                    </tbody>
                  </Table>
                  <Row className="justify-content-center mb-2">
                    <Button
                      onClick={() => handleAddPlayer(i)}
                      variant="primary"
                    >
                      Add Player
                    </Button>
                  </Row>
                </Col>
              ))
              : ""}
          </Row>
          <Row className="my-5">
            <Col>
              <Button onClick={sendUpdatedTeams} variant="success">
                Submit Teams
              </Button>
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
};

export default EditRosters;
