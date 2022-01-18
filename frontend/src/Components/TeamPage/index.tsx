import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Container, Button, Alert, Row } from "react-bootstrap";
import { auth, storage } from "../../firebase-config";
import { TeamTable } from "../shared/TeamTable";
import LeagueButton from "../shared/LeagueButton";
import ImageModal from "../shared/ImageModal";
import EditWeek from "../shared/EditWeek";
import { useLeague } from "../../hooks/useLeague";
import "../../CSS/LeaguePages.css";
import { Team, LineupSettings, FinalizedPlayer } from "@ff-mern/ff-types";
import { useTeamTable } from "../../hooks/useTeamTable";
import { Header } from "./Header";
import { getWeeklyLineup } from "../utils/getWeeklyLineup";

const TeamPage = () => {
  const { id, leagueId } = useParams<{ id: string; leagueId: string }>();
  const { league } = useLeague(leagueId);
  const [team, setTeam] = useState<Team | undefined>();
  const [success, setSuccess] = useState(false);
  const [showImageModal, setShowModal] = useState(false);
  const [week, setWeek] = useState(1);
  const [userIsOwner, setIsOwner] = useState(false);
  const lineup = getWeeklyLineup(week, team, league?.lineupSettings);
  console.log(lineup);
  const { handlePlayerChange, handleBenchPlayer } = useTeamTable(lineup);

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

  const onChange = (
    selectedPlayer: FinalizedPlayer,
    name: string,
    swapPlayer: FinalizedPlayer,
    selectedIndex: number
  ) => {
    if (team) {
      handlePlayerChange(selectedPlayer, name, swapPlayer, selectedIndex);
      setTeam({ ...team });
    }
  };

  const onBench = (selectedPlayer: FinalizedPlayer) => {
    if (team) {
      handleBenchPlayer(selectedPlayer);
      setTeam({ ...team });
    }
  };

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
      {team && league ? (
        <>
          <Header team={team} isOwner={userIsOwner} showModal={setShowModal} />
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
              isOwner={userIsOwner && week > (league.lastScoredWeek || -1)}
              players={lineup}
              positionsInTable={league.lineupSettings}
              name="starters"
              handleBenchPlayer={onBench}
              handlePlayerChange={onChange}
            />
          </Row>
          <Row>
            <h3>Bench</h3>
          </Row>
          <Row>
            <TeamTable
              isOwner={userIsOwner}
              players={lineup}
              positionsInTable={{ bench: 1 } as LineupSettings}
              name="bench"
              handleBenchPlayer={onBench}
              handlePlayerChange={onChange}
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
              <Alert variant="success">Submitted lineup!</Alert>
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
