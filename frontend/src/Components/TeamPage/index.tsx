import React, { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Button, ButtonGroup, Col, Container, Row, Toast } from "react-bootstrap";
import { auth, storage } from "../../firebase-config";
import { TeamTable } from "../shared/TeamTable";
import LeagueButton from "../shared/LeagueButton";
import ImageModal from "../shared/ImageModal";
import EditWeek from "../shared/EditWeek";
import "../../CSS/LeaguePages.css";
import { LineupSettings, FinalizedPlayer, Week } from "@ff-mern/ff-types";
import { useTeamTable } from "../../hooks/useTeamTable";
import { Header } from "./Header";
import { getWeeklyLineup, findPlayerInLineup } from "../utils/getWeeklyLineup";
import { DisplayLastUpdated } from "./DisplayLastUpdated";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { useAuthUser } from "@react-query-firebase/auth";
import { useSingleTeam } from "../../hooks/query/useSingleTeam";
import { SuperflexModal } from "./SuperflexModal";
import { useLeagueScoringData } from "../../hooks/useLeagueScoringData";
import { useSuperflexData } from "../../hooks/useSuperflexData";
import { QuicksetDropdown } from "../shared/QuicksetDropdown";
import cloneDeep from "lodash/cloneDeep";
const TeamPage = () => {
  const { id, leagueId } = useParams() as { id: string; leagueId: string };
  const {
    league,
    week,
    setWeek,
    nflScheduleQuery,
    defenseStatsQuery,
    teamsLoading,
    leagueLoading,
  } = useLeagueScoringData(leagueId);
  const { team, updateTeamMutation, setHighestProjectedLineupMutation, errorMessage, setErrorMessage } = useSingleTeam(id);
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
        updateTeamMutation.mutate(team);
      }
    },
    team,
    league
  );
  const lineup = useMemo(
    () => getWeeklyLineup(week, team, league?.lineupSettings),
    [week, team, league]
  );
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
      updateTeamMutation.mutate(tempTeam);
    }
    if (
      imageUrl !== team.logo &&
      imageUrl !== process.env.REACT_APP_DEFAULT_LOGO
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
            updateTeamMutation.mutate(tempTeam);
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
      if (selectedTempPlayer && swapTempPlayer) {
        handlePlayerChange(
          selectedTempPlayer,
          name,
          swapTempPlayer,
          selectedIndex,
          tempLineup
        );
        updateTeamMutation.mutate(tempTeam);
      }
    }
  };

  const onBench = (selectedPlayer: FinalizedPlayer) => {
    if (team) {
      const tempTeam = cloneDeep(team);
      const tempLineup = getWeeklyLineup(week, tempTeam, league?.lineupSettings);
      const selectedTempPlayer = findPlayerInLineup(tempLineup, selectedPlayer);
      if (selectedTempPlayer) {
        handleBenchPlayer(selectedTempPlayer, tempLineup);
        updateTeamMutation.mutate(tempTeam);
      }
    }
  };

  if (leagueLoading || teamsLoading) {
    return <div className="spinning-loader"></div>;
  }

  return (
    <Container>
      {updateTeamMutation.isLoading || setHighestProjectedLineupMutation.isLoading ? <div className="spinning-loader"></div> : null}
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
      {team && league && user.isSuccess ? (
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

export default TeamPage;
