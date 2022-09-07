import React, { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Button, ButtonGroup, Col, Container, Row } from "react-bootstrap";
import { auth, storage } from "../../firebase-config";
import { TeamTable } from "../shared/TeamTable";
import LeagueButton from "../shared/LeagueButton";
import ImageModal from "../shared/ImageModal";
import EditWeek from "../shared/EditWeek";
import "../../CSS/LeaguePages.css";
import { LineupSettings, FinalizedPlayer, Week } from "@ff-mern/ff-types";
import { useTeamTable } from "../../hooks/useTeamTable";
import { Header } from "./Header";
import { getWeeklyLineup } from "../utils/getWeeklyLineup";
import { DisplayLastUpdated } from "./DisplayLastUpdated";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { useAuthUser } from "@react-query-firebase/auth";
import { useSingleTeam } from "../../hooks/query/useSingleTeam";
import { SuperflexModal } from "./SuperflexModal";
import { useLeagueScoringData } from "../../hooks/useLeagueScoringData";
import { useSuperflexData } from "../../hooks/useSuperflexData";
import { QuicksetDropdown } from "../shared/QuicksetDropdown";

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
  const { team, updateTeamMutation, setHighestProjectedLineupMutation } =
    useSingleTeam(id);
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
      handlePlayerChange(
        selectedPlayer,
        name,
        swapPlayer,
        selectedIndex,
        lineup
      );
      updateTeamMutation.mutate(team);
    }
  };

  const onBench = (selectedPlayer: FinalizedPlayer) => {
    if (team) {
      handleBenchPlayer(selectedPlayer, lineup);
      updateTeamMutation.mutate(team);
    }
  };

  if (leagueLoading || teamsLoading) {
    return <div className="spinning-loader"></div>;
  }

  return (
    <Container>
      <ImageModal
        show={showImageModal}
        origName={(team && team!.name) || ""}
        id={(team && team!.id) || ""}
        handleHide={() => setShowImageModal(!showImageModal)}
        handleInfoSubmission={handleInfoSubmission}
      />
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
                  {(numSuperflexUsed < league.numSuperflex ||
                    (week >= league.lastScoredWeek &&
                      team.weekInfo[week].isSuperflex)) && (
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
                  {week >= league.lastScoredWeek && (
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
              isOwner={
                user.data?.uid === team.owner &&
                week >= (league.lastScoredWeek || -1)
              }
              players={lineup}
              positionsInTable={league.lineupSettings}
              nflSchedule={nflScheduleQuery?.data?.schedule}
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
              isOwner={
                user.data?.uid === team.owner &&
                week >= (league.lastScoredWeek || -1)
              }
              players={lineup}
              positionsInTable={{ bench: 1 } as LineupSettings}
              nflSchedule={nflScheduleQuery?.data?.schedule}
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
