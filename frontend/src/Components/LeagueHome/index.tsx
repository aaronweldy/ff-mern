import React, { useState, useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { Container, Col, Button, Row } from "react-bootstrap";
import { useLeague } from "../../hooks/query/useLeague";
import { auth, storage } from "../../firebase-config";
import "firebase/auth";
import "../../CSS/LeaguePages.css";
import { Team, TeamWeekInfo } from "@ff-mern/ff-types";
import { ref, getDownloadURL } from "firebase/storage";
import { useTeams } from "../../hooks/query/useTeams";
import { useDeleteLeagueMutation } from "../../hooks/query/useDeleteLeagueMutation";
import { useAuthUser } from "@react-query-firebase/auth";
import { CumulativeScoreTable } from "./CumulativeScoreTable";
import { LeagueDeletionModal } from "./LeagueDeletionModal";
import { LeagueName } from "./LeagueName";
import { CommissionerOptions } from "./CommissionerOptions";

function LeagueHome() {
  const { id } = useParams() as { id: string };
  const { league } = useLeague(id);
  const { teams: initTeams } = useTeams(id);
  const deleteLeagueQuery = useDeleteLeagueMutation(id);
  const [teams, setTeams] = useState<Team[]>([]);
  const [showDelete, setDelete] = useState(false);
  const [redirect, setRedirect] = useState(false);
  const [imgUrl, setImgUrl] = useState("");
  const user = useAuthUser("user", auth);
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
          getDownloadURL(ref(storage, `logos/${league.logo}`)).then((url) => {
            setImgUrl(url);
          });
        } else {
          setImgUrl(league.logo);
        }
      }
    });
    return () => unsub();
  }, [id, user, league, initTeams]);

  const deleteLeague = () => {
    deleteLeagueQuery.mutate();
    setRedirect(true);
  };

  if (redirect && deleteLeagueQuery.isSuccess) {
    return <Navigate to="/" />;
  }
  return (
    <Container fluid>
      <LeagueDeletionModal
        showDelete={showDelete}
        setDelete={setDelete}
        deleteLeague={deleteLeague}
        leagueName={league?.name}
      />
      <Row className="mb-3 mt-3 justify-content-center align-items-center">
        <LeagueName leagueName={league?.name} imgUrl={imgUrl} />
      </Row>
      <Row className="mb-3 mt-3 justify-content-center">
        {user.isSuccess &&
        league &&
        league.commissioners.includes(user.data?.uid || "") ? (
          <CommissionerOptions leagueId={id} setDelete={setDelete} />
        ) : (
          ""
        )}
      </Row>
      <Row className="mt-3 table-wrapper pr-1">
        <Col>
          {league && (
            <CumulativeScoreTable id={id} league={league} teams={teams} />
          )}
        </Col>
      </Row>
      <Row className="justify-content-center mb-3">
        {user.isSuccess && league && (
          <Button variant="primary" href={`/league/${id}/runScores/`}>
            {league.commissioners.includes(user.data?.uid || "")
              ? "Run Scores"
              : "View Weekly Scoring Breakdown"}
          </Button>
        )}
        <Button
          className="ml-3"
          variant="primary"
          href={`/league/${id}/cumulativePlayerScores/`}
        >
          Cumulative Player Scoring
        </Button>
        <Button
          className="ml-3"
          variant="primary"
          href={`/league/${id}/tradeCenter/`}
        >
          Trade Center
        </Button>
      </Row>
    </Container>
  );
}

export default LeagueHome;
