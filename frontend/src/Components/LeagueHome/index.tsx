import { TeamWeekInfo } from "@ff-mern/ff-types";
import { useAuthUser } from "@react-query-firebase/auth";
import "firebase/auth";
import { getDownloadURL, ref } from "firebase/storage";
import { useEffect, useMemo, useState } from "react";
import { Button, Col, Container, Row } from "react-bootstrap";
import { Navigate, useParams } from "react-router-dom";
import "../../CSS/LeaguePages.css";
import { auth, storage } from "../../firebase-config";
import { useCreateDraft } from "../../hooks/query/useCreateDraftMutation";
import { useDeleteDraftMutation } from "../../hooks/query/useDeleteDraftMutation";
import { useDeleteLeagueMutation } from "../../hooks/query/useDeleteLeagueMutation";
import { useDraftForLeague } from "../../hooks/query/useDraftForLeague";
import { useLeague } from "../../hooks/query/useLeague";
import { useTeams } from "../../hooks/query/useTeams";
import { ConfirmationModal } from "../shared/ConfirmationModal";
import { CommissionerOptions } from "./CommissionerOptions";
import { CreateDraftModal, DraftFormState } from "./CreateDraftModal";
import {
  CumulativeScoreTable,
  CumulativeScoreTableLoadingState,
} from "./CumulativeScoreTable";
import { LeagueDeletionModal } from "./LeagueDeletionModal";
import { LeagueName } from "./LeagueName";
import { LiveDraftRow } from "./LiveDraftRow";
import "./style.css";

export const LeagueHome = () => {
  const { id } = useParams() as { id: string };
  const { league, isLoading: leagueLoading } = useLeague(id);
  const { teams: initTeams, query: teamsQuery } = useTeams(id);
  const deleteLeagueQuery = useDeleteLeagueMutation(id);
  const [showDelete, setDelete] = useState(false);
  const [redirect, setRedirect] = useState(false);
  const [imgUrl, setImgUrl] = useState("");
  const [showDraftModal, setShowModal] = useState(false);
  const [showDeleteDraftModal, setShowDeleteDraft] = useState(false);
  const draftQuery = useDraftForLeague(id);
  const user = useAuthUser("user", auth);
  const teams = useMemo(() => {
    const reducer = (acc: number, info: TeamWeekInfo) =>
      acc + info.weekScore + info.addedPoints;

    return [...initTeams].sort(
      (a, b) =>
        b.weekInfo.reduce(reducer, 0) - a.weekInfo.reduce(reducer, 0)
    );
  }, [initTeams]);
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
    if (!league) {
      return;
    }
    if (league.logo !== import.meta.env.VITE_DEFAULT_LOGO) {
      getDownloadURL(ref(storage, `logos/${league.logo}`)).then((url) => {
        setImgUrl(url);
      }).catch((err) => {
        console.log(err);
      });
    } else {
      setImgUrl(league.logo);
    }
  }, [league]);
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

  const leagueTableLoading = leagueLoading || teamsQuery.isLoading;
  const loadingTeamRows = teamsQuery.isLoading
    ? Math.max(initTeams.length, 10)
    : Math.max(teams.length, 1);

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
      <Row
        className="mb-3 mt-3 justify-content-center league-commissioner-options-row"
        aria-busy={user.isLoading}
      >
        {userIsCommissioner ? (
          <CommissionerOptions leagueId={id} setDelete={setDelete} />
        ) : user.isLoading ? (
          <div
            className="league-commissioner-options-loading"
            aria-hidden="true"
          />
        ) : (
          ""
        )}
      </Row>
      <Row className="mt-3 table-wrapper pr-1">
        <Col>
          {leagueTableLoading ? (
            <CumulativeScoreTableLoadingState
              numWeeks={league?.numWeeks}
              rows={loadingTeamRows}
            />
          ) : league ? (
            <CumulativeScoreTable id={id} league={league} teams={teams} />
          ) : null}
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
