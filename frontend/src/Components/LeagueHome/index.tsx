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
import { useLeague } from "../../hooks/useLeague";
import { auth, storage } from "../../firebase-config";
import "firebase/auth";
import "../../CSS/LeaguePages.css";
import { Team, TeamWeekInfo } from "@ff-mern/ff-types";

function LeagueHome() {
  const { id } = useParams<{ id: string }>();
  const { league, teams: initTeams } = useLeague(id);
  const [teams, setTeams] = useState<Team[]>([]);
  const [runScores, setRunScores] = useState(false);
  const [showDelete, setDelete] = useState(false);
  const [redirect, setRedirect] = useState(false);
  const [deleteName, setName] = useState("");
  const [imgUrl, setImgUrl] = useState("");
  const user = auth.currentUser;
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (newUser) => {
      if (newUser && league) {
        const sortedTeams = initTeams.sort((a, b) => {
          const reducer = (acc: number, i: TeamWeekInfo) =>
            acc + i.weekScore + i.addedPoints;
          return b.weekInfo.reduce(reducer, 0) - a.weekInfo.reduce(reducer, 0);
        });
        setTeams(sortedTeams);
        if (league.logo !== process.env.REACT_APP_DEFAULT_LOGO) {
          storage
            .ref(`logos/${league.logo}`)
            .getDownloadURL()
            .then((url) => {
              setImgUrl(url);
            });
        } else {
          setImgUrl(league.logo);
        }
      }
    });
    return () => unsub();
  }, [id, user, league, initTeams]);
  if (runScores) {
    return <Redirect to={`/league/${id}/runScores/`} />;
  }
  const deleteLeague = () => {
    const url = `${process.env.REACT_APP_PUBLIC_URL}/api/v1/league/${id}/delete/`;
    const body = { user: user ? user.uid : 0 };
    const reqDict = {
      headers: { "content-type": "application/json" },
      method: "POST",
      body: JSON.stringify(body),
    };
    fetch(url, reqDict)
      .then((resp) => {
        if (!resp.ok) {
          throw Error(resp.statusText);
        }
        return resp.json();
      })
      .then(() => {
        setRedirect(true);
      })
      .catch((e) => {
        console.log(e);
      });
  };

  if (redirect) {
    return <Redirect to="/" />;
  }
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setName(e.target.value)
                }
              />
            </Col>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDelete(false)}>
            Close
          </Button>
          <Button
            disabled={deleteName !== (league && league.name)}
            variant="danger"
            onClick={deleteLeague}
          >
            Confirm Deletion
          </Button>
        </Modal.Footer>
      </Modal>
      <Row className="mb-3 mt-3 justify-content-center align-items-center">
        {imgUrl ? (
          <Image className="image-fit-height" src={imgUrl} rounded />
        ) : (
          ""
        )}
        <Col sm="auto">
          <h1>{league && league.name}</h1>
        </Col>
      </Row>
      <Row className="mb-3 mt-3 justify-content-center">
        {user && league && league.commissioners.includes(user.uid) ? (
          <div>
            <a href={`/league/${id}/editTeams/`}>Edit Teams</a> |{" "}
            <a href={`/league/${id}/editScoringSettings/`}> Edit Scoring</a> |{" "}
            <a href={`/league/${id}/addPoints/`}> Adjust Weekly Scores</a> |
            <a href={`/league/${id}/adjustLineups/`}>
              {" "}
              Adjust Starting Lineups
            </a>{" "}
            | <a href={`/league/${id}/updateSettings/`}>
              Adjust Settings
            </a> |{" "}
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
        {league && (
          <Table striped hover className="hide-cells">
            <thead>
              <tr>
                <th />
                <th>Team Name</th>
                <th>Team Owner</th>
                {[
                  ...Array(league.numWeeks)
                    .fill(0)
                    .map((_, i) => <th key={i}>{i + 1}</th>),
                ]}
                <th>Total Points</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, i) => {
                const linked =
                  team.ownerName !== "default" ? (
                    <a href={`/user/${team.owner}/`}>{team.ownerName}</a>
                  ) : (
                    team.ownerName
                  );
                console.log(team);
                return (
                  <tr key={i}>
                    <td>
                      <Image
                        className="thumbnail-image"
                        src={team.logo || process.env.REACT_APP_DEFAULT_LOGO}
                      />
                    </td>
                    <td>
                      <a href={`/league/${id}/team/${team.id}/`}>{team.name}</a>
                    </td>
                    <td>
                      {league && league.commissioners.includes(team.owner) ? (
                        <OverlayTrigger
                          placement="top"
                          overlay={
                            <Tooltip id={i.toString()}>Commissioner</Tooltip>
                          }
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
                      ...Array(league.numWeeks)
                        .fill(0)
                        .map((_, idx) => (
                          <td key={idx}>
                            {(
                              team.weekInfo[idx + 1].weekScore +
                              team.weekInfo[idx + 1].addedPoints
                            ).toFixed(2)}
                          </td>
                        )),
                    ]}
                    <td>
                      {team.weekInfo
                        .reduce(
                          (acc, _, week) => acc + Team.sumWeekScore(team, week),
                          0
                        )
                        .toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Row>
      <Row className="justify-content-center">
        {user && league && league.commissioners.includes(user.uid) ? (
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
