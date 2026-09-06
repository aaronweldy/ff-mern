import { FinalizedPlayer, LineupSettings, Week } from "@ff-mern/ff-types";
import { useAuthUser } from "@react-query-firebase/auth";
import { getDownloadURL, ref, uploadString } from "firebase/storage";
import cloneDeep from "lodash/cloneDeep";
import { useMemo, useState } from "react";
import { Button, ButtonGroup, Col, Container, Row, Toast } from "react-bootstrap";
import { useParams } from "react-router-dom";
import "../../CSS/LeaguePages.css";
import { auth, storage } from "../../firebase-config";
import { useSingleTeam } from "../../hooks/query/useSingleTeam";
import { useLeagueScoringData } from "../../hooks/useLeagueScoringData";
import { useSuperflexData } from "../../hooks/useSuperflexData";
import { useTeamTable } from "../../hooks/useTeamTable";
import EditWeek from "../shared/EditWeek";
import ImageModal from "../shared/ImageModal";
import LeagueButton from "../shared/LeagueButton";
import { QuicksetDropdown } from "../shared/QuicksetDropdown";
import { TeamTable } from "../shared/TeamTable";
import { findPlayerInLineup, getWeeklyLineup } from "../utils/getWeeklyLineup";
import { DisplayLastUpdated } from "./DisplayLastUpdated";
import { Header } from "./Header";
import { SuperflexModal } from "./SuperflexModal";
const TeamPage = () => {
  const { id, leagueId } = useParams() as { id: string; leagueId: string };
  const {
    league,
    week,
    setWeek,
    nflScheduleQuery,
    defenseStatsQuery,
    isLoading: scoringDataLoading,
  } = useLeagueScoringData(leagueId);
  const {
    team,
    isLoading: teamLoading,
    updateTeamMutation,
    setHighestProjectedLineupMutation,
    errorMessage,
    setErrorMessage,
  } = useSingleTeam(id);
  const user = useAuthUser(["user"], auth);
  const [showImageModal, setShowImageModal] = useState(false);
  const {
    showSuperflexModal,
    setShowSuperflexModal,
    numSuperflexUsed,
    handleSuperflexUpdate,
  } = useSuperflexData(
    week,
    () => {
      if (team) {
        updateTeamMutation.mutate({ team });
      }
    },
    team,
    league
  );
  const lineup = useMemo(
    () => getWeeklyLineup(week, team, league?.lineupSettings),
    [week, team, league]
  );
  const loadingStarterRows = league
    ? Object.values(league.lineupSettings).reduce(
        (total, positionCount) => total + positionCount,
        0
      )
    : 8;
  const loadingBenchRows = lineup.bench?.length || 6;
  const { handlePlayerChange, handleBenchPlayer } = useTeamTable();
  const canEditRoster = useMemo(() => {
    if (!league) {
      return false;
    }
    if (league.lastScoredWeek <= 1) {
      return true;
    }
    const datePST = new Date().toLocaleDateString("en-US", {
      timeZone: "America/Los_Angeles",
    });
    const day = new Date(datePST).getDay();
    console.log(week, league.lastScoredWeek, day);
    return week >= league.lastScoredWeek;
  }, [league, week]);

  const handleInfoSubmission = (imageUrl: string, teamName?: string) => {
    if (!team) {
      return;
    }
    const tempTeam = { ...team };
    if (teamName && teamName !== tempTeam.name) {
      tempTeam.name = teamName;
      updateTeamMutation.mutate({ team: tempTeam });
    }
    if (
      imageUrl !== team.logo &&
      imageUrl !== import.meta.env.VITE_DEFAULT_LOGO
    ) {
      uploadString(ref(storage, `${team.id}/logo`), imageUrl, "data_url").then(
        (snapshot) => {
          getDownloadURL(snapshot.ref).then((url) => {
            setShowImageModal(false);
            const tempTeam = { ...team };
            tempTeam.logo = url;
            if (teamName) {
              tempTeam.name = teamName;
            }
            updateTeamMutation.mutate({ team: tempTeam });
          }).catch((error) => {
            console.error(error);
          });
        }
      );
    } else {
      setShowImageModal(false);
    }
  };

  const onChange = (
    selectedPlayer: FinalizedPlayer,
    name: string,
    swapPlayer: FinalizedPlayer,
    selectedIndex: number
  ) => {
    if (team) {
      const tempTeam = cloneDeep(team);
      const tempLineup = getWeeklyLineup(week, tempTeam, league?.lineupSettings);
      const selectedTempPlayer = findPlayerInLineup(tempLineup, selectedPlayer);
      const swapTempPlayer = findPlayerInLineup(tempLineup, swapPlayer);
      console.log(selectedTempPlayer, swapTempPlayer, selectedIndex);
      if (selectedTempPlayer && swapTempPlayer) {
        handlePlayerChange(
          selectedTempPlayer.player,
          name,
          swapTempPlayer.player,
          selectedTempPlayer.index,
          tempLineup
        );
        updateTeamMutation.mutate({ team: tempTeam });
      }
    }
  };

  const onBench = (selectedPlayer: FinalizedPlayer) => {
    if (team) {
      const tempTeam = cloneDeep(team);
      const tempLineup = getWeeklyLineup(week, tempTeam, league?.lineupSettings);
      const selectedTempPlayer = findPlayerInLineup(tempLineup, selectedPlayer);
      if (selectedTempPlayer) {
        handleBenchPlayer(selectedTempPlayer.player, tempLineup);
        updateTeamMutation.mutate({ team: tempTeam });
      }
    }
  };

  const pageIsLoading = scoringDataLoading || teamLoading || !user.isSuccess;

  return (
    <Container aria-busy={pageIsLoading}>
      {updateTeamMutation.isLoading || setHighestProjectedLineupMutation.isLoading ? (
        <div className="spinning-loader"></div>
      ) : null}
      <ImageModal
        show={showImageModal}
        origName={(team && team!.name) || ""}
        id={(team && team!.id) || ""}
        handleHide={() => setShowImageModal(!showImageModal)}
        handleInfoSubmission={handleInfoSubmission}
      />
      <Toast
        show={!!errorMessage}
        onClose={() => setErrorMessage(null)}
        delay={3000}
        autohide
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          minWidth: 200,
          zIndex: 9999
        }}
      >
        <Toast.Header>
          <strong className="mr-auto">Error</strong>
        </Toast.Header>
        <Toast.Body>{errorMessage}</Toast.Body>
      </Toast>
      <Row className="mt-3">
        <LeagueButton id={leagueId} />
      </Row>
      {pageIsLoading ? (
        <TeamPageLoadingState
          starterRows={loadingStarterRows}
          benchRows={loadingBenchRows}
        />
      ) : team && league && user.isSuccess ? (
        <>
          <Header team={team} showModal={setShowImageModal} />
          <Row>
            <Col sm={2}>
              <EditWeek
                week={week}
                maxWeeks={(league && league.numWeeks) || 18}
                onChange={(e) => setWeek(parseInt(e.target.value))}
              />
            </Col>
            {user.data?.uid === team.owner ? (
              <Col className="mt-3">
                <ButtonGroup>
                  {numSuperflexUsed < league.numSuperflex && canEditRoster && (
                    <Button
                      onClick={() => setShowSuperflexModal(true)}
                      className="mr-2"
                    >
                      Use Superflex Lineup
                    </Button>
                  )}
                  <Button
                    onClick={() => setShowImageModal(true)}
                    className="mr-2"
                  >
                    Change/Set Team Info
                  </Button>
                  {canEditRoster && (
                    <QuicksetDropdown
                      week={week}
                      mutationFn={setHighestProjectedLineupMutation}
                      lineupSettings={league.lineupSettings}
                    />
                  )}
                </ButtonGroup>
              </Col>
            ) : null}
          </Row>

          <Row>
            <DisplayLastUpdated lastUpdated={team.lastUpdated} />
          </Row>
          <Row>
            <h3>Starters</h3>
          </Row>
          <Row>
            <TeamTable
              isOwner={user.data?.uid === team.owner && canEditRoster}
              players={lineup}
              positionsInTable={league.lineupSettings}
              nflSchedule={nflScheduleQuery?.data}
              nflDefenseStats={defenseStatsQuery?.data?.data}
              name="starters"
              week={week.toString() as Week}
              handleBenchPlayer={onBench}
              handlePlayerChange={onChange}
              showScores={true}
              leagueId={leagueId}
            />
          </Row>
          <Row>
            <h3>Bench</h3>
          </Row>
          <Row>
            <TeamTable
              isOwner={user.data?.uid === team.owner && canEditRoster}
              players={lineup}
              positionsInTable={{ bench: 1 } as LineupSettings}
              nflSchedule={nflScheduleQuery?.data}
              nflDefenseStats={defenseStatsQuery?.data?.data}
              name="bench"
              week={week.toString() as Week}
              handleBenchPlayer={onBench}
              handlePlayerChange={onChange}
              showScores={true}
              leagueId={leagueId}
            />
          </Row>
          <SuperflexModal
            leagueLineupSettings={league.lineupSettings}
            show={showSuperflexModal}
            handleHide={() => setShowSuperflexModal(false)}
            handleSubmit={handleSuperflexUpdate}
          />
        </>
      ) : (
        ""
      )}
    </Container>
  );
};

const TeamPageLoadingState = ({
  starterRows,
  benchRows,
}: {
  starterRows: number;
  benchRows: number;
}) => (
  <div className="team-page-loading" role="status" aria-live="polite">
    <span className="sr-only">Loading team page</span>

    <Row className="mt-3 mb-3">
      <Col sm="auto" className="mt-1">
        <div className="team-page-skeleton team-page-skeleton--logo" />
      </Col>
      <Col sm="auto" className="team-page-skeleton-copy">
        <div className="team-page-skeleton team-page-skeleton--title" />
        <div className="team-page-skeleton team-page-skeleton--subtitle" />
      </Col>
    </Row>

    <Row>
      <Col sm={2}>
        <div className="team-page-skeleton team-page-skeleton--week" />
      </Col>
      <Col className="mt-3">
        <div className="team-page-skeleton-actions">
          <div className="team-page-skeleton team-page-skeleton--button" />
          <div className="team-page-skeleton team-page-skeleton--button team-page-skeleton--button-wide" />
          <div className="team-page-skeleton team-page-skeleton--button team-page-skeleton--button-wide" />
        </div>
      </Col>
    </Row>

    <Row>
      <div className="team-page-skeleton team-page-skeleton--updated" />
    </Row>
    <Row>
      <div className="team-page-skeleton team-page-skeleton--heading" />
    </Row>
    <TeamTableLoadingState rows={starterRows} />
    <Row>
      <div className="team-page-skeleton team-page-skeleton--heading" />
    </Row>
    <TeamTableLoadingState rows={benchRows} />
  </div>
);

const TeamTableLoadingState = ({ rows }: { rows: number }) => (
  <div className="team-page-skeleton-table" aria-hidden="true">
    <div className="team-page-skeleton-table__row team-page-skeleton-table__row--header">
      {Array.from({ length: 6 }, (_, index) => (
        <div className="team-page-skeleton team-page-skeleton--cell" key={`header-${index}`} />
      ))}
    </div>
    {Array.from({ length: rows }, (_, rowIndex) => (
      <div className="team-page-skeleton-table__row" key={`row-${rowIndex}`}>
        {Array.from({ length: 6 }, (_, cellIndex) => (
          <div className="team-page-skeleton team-page-skeleton--cell" key={`cell-${rowIndex}-${cellIndex}`} />
        ))}
      </div>
    ))}
  </div>
);

export default TeamPage;
