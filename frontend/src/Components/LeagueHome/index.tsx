import React, { useState, useEffect, useMemo } from "react";
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
import { useCreateDraft } from "../../hooks/query/useCreateDraftMutation";
import { CreateDraftModal, DraftFormState } from "./CreateDraftModal";
import { useDraftForLeague } from "../../hooks/query/useDraftForLeague";
import "./style.css";
import { LiveDraftRow } from "./LiveDraftRow";
import { ConfirmationModal } from "../shared/ConfirmationModal";
import { useDeleteDraftMutation } from "../../hooks/query/useDeleteDraftMutation";

export const LeagueHome = () => {
  const { id } = useParams() as { id: string };
  const { league } = useLeague(id);
  const { teams: initTeams } = useTeams(id);
  const deleteLeagueQuery = useDeleteLeagueMutation(id);
  const [teams, setTeams] = useState<Team[]>([]);
  const [showDelete, setDelete] = useState(false);
  const [redirect, setRedirect] = useState(false);
  const [imgUrl, setImgUrl] = useState("");
  const [showDraftModal, setShowModal] = useState(false);
  const [showDeleteDraftModal, setShowDeleteDraft] = useState(false);
  const draftQuery = useDraftForLeague(id);
  const user = useAuthUser("user", auth);
  const deleteDraftMutation = useDeleteDraftMutation(
    id,
    draftQuery.data?.draft?.settings.draftId || ""
  );
  const createDraftMutation = useCreateDraft(
    id,
    draftQuery.data?.draft,
    league
  );
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
          }).catch((err) => {
            console.log(err);
          });
        } else {
          setImgUrl(league.logo);
        }
      }
    });
    return () => unsub();
  }, [id, user, league, initTeams]);
  const liveDraftExists = useMemo(() => {
    return (
      draftQuery.isSuccess &&
      (draftQuery.data.draft?.phase === "predraft" ||
        draftQuery.data.draft?.phase === "live")
    );
  }, [draftQuery.isSuccess, draftQuery.data]);
  const userIsCommissioner = useMemo(() => {
    if (user.isSuccess && league) {
      return league.commissioners.includes(user.data?.uid || "");
    }
    return false;
  }, [user.isSuccess, user.data, league]);
  const deleteLeague = () => {
    deleteLeagueQuery.mutate();
    setRedirect(true);
  };

  const createDraft = (draftState: DraftFormState) => {
    createDraftMutation.mutate(draftState);
    setShowModal(false);
  };

  const deleteDraft = () => {
    deleteDraftMutation.mutate();
    setShowDeleteDraft(false);
  };

  if (redirect && deleteLeagueQuery.isSuccess) {
    return <Navigate to="/" />;
  }
  return (
    <Container fluid>
      {draftQuery.isSuccess && liveDraftExists && (
        <LiveDraftRow
          userIsCommissioner={userIsCommissioner}
          liveDraftExists={liveDraftExists}
          draft={draftQuery.data.draft}
          onEdit={() => setShowModal(true)}
          onDelete={() => setShowDeleteDraft(true)}
        />
      )}
      {league && (
        <CreateDraftModal
          show={showDraftModal}
          league={league}
          onHide={() => setShowModal(false)}
          onConfirm={createDraft}
          existingDraft={draftQuery.data?.draft || undefined}
        />
      )}
      <ConfirmationModal
        show={showDeleteDraftModal}
        onHide={() => setShowDeleteDraft(false)}
        onConfirm={deleteDraft}
        title="Delete Draft"
      />
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
        {userIsCommissioner ? (
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
            {userIsCommissioner
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
        {league &&
          draftQuery.isSuccess &&
          !draftQuery.data.draft &&
          userIsCommissioner && (
            <Button
              className="ml-3"
              onClick={() => setShowModal(true)}
              variant="primary"
            >
              Create Draft
            </Button>
          )}
      </Row>
    </Container>
  );
};
