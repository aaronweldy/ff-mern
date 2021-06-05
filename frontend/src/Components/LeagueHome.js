import React, { useState, useEffect } from "react";
import { Redirect, useParams } from "react-router-dom";
import {
  Table,
  Form,
  Container,
  Col,
  Button,
  Modal,
  Row,
  Tooltip,
  OverlayTrigger,
  Image,
} from "react-bootstrap";
import { auth, storage } from "../firebase-config";
import "firebase/auth";
import "../CSS/LeaguePages.css";

function LeagueHome(props) {
  const { id } = useParams();
  const [teams, setTeams] = useState([]);
  const [commissioners, setCommissioners] = useState([]);
  const [runScores, setRunScores] = useState(false);
  const [showDelete, setDelete] = useState(false);
  const [redirect, setRedirect] = useState(false);
  const [leagueName, setLeagueName] = useState(null);
  const [deleteName, setName] = useState(null);
  const [imgUrl, setImgUrl] = useState(null);
  const user = auth.currentUser;
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const url = `/api/v1/league/${id}/`;
        const resp = await fetch(url);
        const json = await resp.json();
        const sortedTeams = json.teams.sort((a, b) => {
          const reducer = (acc, i) => (i ? acc + i : acc + 0);
          return (
            b.weekScores.reduce(reducer, 0) +
            b.addedPoints.reduce(reducer, 0) -
            (a.weekScores.reduce(reducer, 0) + a.addedPoints.reduce(reducer, 0))
          );
        });
        setTeams(sortedTeams);
        setCommissioners(json.league.commissioners);
        setLeagueName(json.league.name);
        if (json.league.logo !== process.env.REACT_APP_DEFAULT_LOGO) {
          storage
            .ref(`logos/${json.league.logo}`)
            .getDownloadURL()
            .then((url) => {
              setImgUrl(url);
            });
        } else {
          setImgUrl(json.league.logo);
        }
      }
    });
    return () => unsub();
  }, [id, user]);
  if (runScores)
    return <Redirect to={"/league/" + id + "/runScores/"}></Redirect>;

  const deleteLeague = () => {
    const url = `/api/v1/league/${id}/delete/`;
    const body = { user: user ? user.uid : 0 };
    const reqDict = {
      headers: { "content-type": "application/json" },
      method: "POST",
      body: JSON.stringify(body),
    };
    fetch(url, reqDict)
      .then((resp) => {
        if (!resp.ok) throw Error(resp.statusText);
        return resp.json();
      })
      .then(() => {
        setRedirect(true);
      })
      .catch((e) => {
        console.log(e);
      });
  };

  if (redirect) return <Redirect to="/"></Redirect>;
  return (
    <Container>
      <Modal show={showDelete} onHide={() => setDelete(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete League</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Type the name of the league to confirm deletion:
          <Form.Group className="mt-3" as={Row}>
            <Col md={6}>
              <Form.Control
                type="text"
                onChange={(e) => setName(e.target.value)}
              ></Form.Control>
            </Col>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDelete(false)}>
            Close
          </Button>
          <Button
            disabled={deleteName !== leagueName}
            variant="danger"
            onClick={deleteLeague}
          >
            Confirm Deletion
          </Button>
        </Modal.Footer>
      </Modal>
      <Row className="mb-3 mt-3 justify-content-center align-items-center">
        {imgUrl ? (
          <Image className="image-fit-height" src={imgUrl} rounded></Image>
        ) : (
          ""
        )}
        <Col sm="auto">
          <h1>{leagueName ? teams[0].leagueName : ""}</h1>
        </Col>
      </Row>
      <Row className="mb-3 mt-3 justify-content-center">
        {user && commissioners.includes(user.uid) ? (
          <div>
            <a href={"/league/" + id + "/editTeams/"}>Edit Teams</a> |
            <a href={"/league/" + id + "/editSettings/"}> Edit Scoring</a> |
            <a href={"/league/" + id + "/addPoints/"}> Adjust Weekly Scores</a>{" "}
            |
            <a href={"/league/" + id + "/adjustLineups/"}>
              {" "}
              Adjust Starting Lineups
            </a>{" "}
            |
            <Button
              className="ml-1 mb-1"
              id="inline-button"
              variant="link"
              onClick={() => setDelete(true)}
            >
              {" "}
              Delete League
            </Button>
          </div>
        ) : (
          ""
        )}
      </Row>
      <Row className="mb-3 mt-3 justify-content-center">
        <Table striped hover className="hide-cells">
          <thead>
            <tr>
              <th></th>
              <th>Team Name</th>
              <th>Team Owner</th>
              {[
                ...Array(17)
                  .fill()
                  .map((_, i) => {
                    return <th key={i}>{i + 1}</th>;
                  }),
              ]}
              <th>Total Points</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team, i) => {
              const linked =
                team.ownerName !== "default" ? (
                  <a
                    href={
                      process.env.REACT_APP_PUBLIC_URL + "/user/" + team.owner
                    }
                  >
                    {team.ownerName}
                  </a>
                ) : (
                  team.ownerName
                );
              return (
                <tr key={i}>
                  <td>
                    <Image
                      className="thumbnail-image"
                      src={team.logo || process.env.REACT_APP_DEFAULT_LOGO}
                    ></Image>
                  </td>
                  <td>
                    <a href={"/league/" + id + "/team/" + team.id + "/"}>
                      {team.name}
                    </a>
                  </td>
                  <td>
                    {commissioners.includes(team.owner) ? (
                      <OverlayTrigger
                        position="top"
                        overlay={<Tooltip>Commissioner</Tooltip>}
                      >
                        <span>
                          <b>{linked}</b>
                        </span>
                      </OverlayTrigger>
                    ) : (
                      <span>{linked}</span>
                    )}
                  </td>
                  {[
                    ...Array(17)
                      .fill()
                      .map((_, i) => {
                        return (
                          <td key={i}>
                            {team.weekScores[i + 1]
                              ? (
                                  team.weekScores[i + 1] +
                                  (team.addedPoints[i + 1] || 0)
                                ).toFixed(2)
                              : 0}
                          </td>
                        );
                      }),
                  ]}
                  <td>
                    {(
                      team.weekScores.reduce((acc, i) => acc + i, 0) +
                      team.addedPoints.reduce((acc, i) => acc + i, 0)
                    ).toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Row>
      <Row className="justify-content-center">
        {user && commissioners.includes(user.uid) ? (
          <Button
            className="mt-3 mb-3"
            variant="primary"
            onClick={() => setRunScores(true)}
          >
            Run Scores
          </Button>
        ) : (
          <Button
            className="mt-3 mb-3"
            variant="primary"
            onClick={() => setRunScores(true)}
          >
            View Weekly Scoring Breakdown
          </Button>
        )}
      </Row>
    </Container>
  );
}

export default LeagueHome;
