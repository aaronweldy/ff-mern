import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Container, Col, Button, Alert, Row, Image } from "react-bootstrap";
import { auth, storage } from "../firebase-config";
import TeamTable from "./TeamTable";
import LeagueButton from "./LeagueButton";
import ImageModal from "./ImageModal";
import EditWeek from "./EditWeek";

import { lineupSorter } from "../constants/index";
import { useLeague } from "../hooks/useLeague";
import "../CSS/LeaguePages.css";
import { LocalPlayer, Position, SinglePosition, Team } from "../ff-types/types";

const TeamPage = () => {
  const { id, leagueId } = useParams<{ id: string; leagueId: string }>();
  const { league } = useLeague(leagueId);
  const [team, setTeam] = useState<Team | null>(null);
  const [success, setSuccess] = useState(false);
  const [showImageModal, setShowModal] = useState(false);
  const [week, setWeek] = useState(1);
  const [userIsOwner, setIsOwner] = useState(false);
  useEffect(() => {
    const url = `${process.env.REACT_APP_PUBLIC_URL}/api/v1/league/${leagueId}/team/${id}/`;
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const resp = await fetch(url);
        const data = await resp.json();
        setTeam(data.team);
        setIsOwner(data.team.owner === user.uid);
      }
    });
    return () => unsub();
  }, [week, league, leagueId, id]);

  useEffect(() => {
    if (league) {
      setWeek(league.lastScoredWeek + 1 || 1);
    }
  }, [league]);
  const handlePlayerChange = (
    selectedPlayer: LocalPlayer,
    name: string,
    swapPlayer: LocalPlayer
  ) => {
    console.log(selectedPlayer);
    console.log(name);
    console.log(swapPlayer);
    if (name === "starters") {
      swapPlayer.lineup[week] = selectedPlayer.lineup[week];
      selectedPlayer.lineup[week] = "bench";
    } else if (name === "backup") {
      if (swapPlayer.dummyPlayer) {
        selectedPlayer.backup[week] = "";
      } else {
        selectedPlayer.backup[week] = swapPlayer.name;
      }
    } else {
      selectedPlayer.lineup[week] = swapPlayer.lineup[week];
      if (!swapPlayer.dummyPlayer) {
        swapPlayer.lineup[week] = "bench";
      }
    }
    if (team) {
      setTeam({ ...team });
    }
  };
  const handleBenchPlayer = (selectedPlayer: LocalPlayer) => {
    selectedPlayer.lineup[week] = "bench";
    if (team) {
      setTeam({ ...team });
    }
  };
  const handleInfoSubmission = (imageUrl: string, teamName?: string) => {
    const sendUrl = `${process.env.REACT_APP_PUBLIC_URL}/api/v1/league/updateTeamInfo/`;
    const body = { id, url: imageUrl, name: teamName };
    let reqdict = {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    };
    if (
      imageUrl !== team!.logo &&
      imageUrl !== process.env.REACT_APP_DEFAULT_LOGO
    ) {
      storage
        .ref()
        .child(`${team!.id}/logo`)
        .putString(imageUrl, "data_url")
        .then((snapshot) => {
          snapshot.ref.getDownloadURL().then((url) => {
            setShowModal(false);
            body.url = url;
            reqdict = { ...reqdict, body: JSON.stringify(body) };
            fetch(sendUrl, reqdict)
              .then((resp) => resp.json())
              .then((data) => {
                setTeam(data.team);
              })
              .catch((e) => console.log(e));
          });
        });
    } else {
      setShowModal(false);
      fetch(sendUrl, reqdict)
        .then((resp) => resp.json())
        .then((data) => {
          setTeam(data.team);
        })
        .catch((e) => console.log(e));
    }
  };
  const sendUpdatedTeams = () => {
    const url = `${process.env.REACT_APP_PUBLIC_URL}/api/v1/league/updateTeams/`;
    const body = { teams: [team], week };
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
  let starters: LocalPlayer[] = [];
  let bench: LocalPlayer[] = [];
  if (team && league) {
    starters = (Object.keys(league.lineupSettings) as Position[])
      .sort(lineupSorter)
      .map((pos: Position) => [
        ...Array(league.lineupSettings[pos])
          .fill({})
          .map(
            () =>
              new LocalPlayer(
                "",
                pos.split("/")[0] as SinglePosition,
                pos,
                league.numWeeks+1,
                true
              )
          ),
      ])
      .flat();
    team.players
      .filter((player) => player.lineup[week] !== "bench")
      .forEach((starter) => {
        starters[
          starters.findIndex(
            (player) =>
              player.lineup[week] === starter.lineup[week] && player.name === ""
          )
        ] = starter;
      });

    bench = team.players.filter((player) => player.lineup[week] === "bench");
  }
  return (
    <Container>
      <ImageModal
        show={showImageModal}
        origName={(team && team!.name) || ""}
        id={(team && team!.id) || ""}
        handleHide={() => setShowModal(!showImageModal)}
        handleInfoSubmission={handleInfoSubmission}
      />
      <Row>
        <LeagueButton id={leagueId} />
      </Row>
      {team ? (
        <>
          <Row className="mt-3 mb-3">
            <Col sm="auto">
              <Image
                className="image-fit-height"
                src={team.logo || process.env.REACT_APP_DEFAULT_LOGO}
              />
            </Col>
            <Col sm="auto">
              <h1 className="mt-2">
                {team.name}
                <div className="subtitle mb-3 mt-2">{team.ownerName}</div>
              </h1>
            </Col>
            {userIsOwner ? (
              <Col className="mt-3">
                <Button onClick={() => setShowModal(true)}>
                  Change/Set Team Logo
                </Button>
              </Col>
            ) : null}
          </Row>
          <EditWeek
            week={week}
            maxWeeks={(league && league.numWeeks) || 18}
            onChange={(e) => setWeek(parseInt(e.target.value))}
          />
          <Row>
            <h3>Starters</h3>
          </Row>
          <Row>
            <TeamTable
              isOwner={userIsOwner}
              players={starters}
              oppPlayers={bench}
              week={week}
              name="starters"
              handleBenchPlayer={handleBenchPlayer}
              handlePlayerChange={handlePlayerChange}
            />
          </Row>
          <Row>
            <h3>Bench</h3>
          </Row>
          <Row>
            <TeamTable
              isOwner={userIsOwner}
              players={bench}
              oppPlayers={starters}
              week={week}
              name="bench"
              handleBenchPlayer={handleBenchPlayer}
              handlePlayerChange={handlePlayerChange}
            />
          </Row>
          <Row>
            <Button
              className="mb-3 mt-2"
              variant="success"
              onClick={sendUpdatedTeams}
            >
              Submit Lineup
            </Button>
          </Row>
          {success ? (
            <Row>
              <Col sm="auto">
                <Alert variant="success">Submitted lineup!</Alert>
              </Col>
            </Row>
          ) : (
            ""
          )}
        </>
      ) : (
        ""
      )}
    </Container>
  );
};

export default TeamPage;
