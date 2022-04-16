import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Button, ButtonGroup, Col, Container, Row } from "react-bootstrap";
import { auth, storage } from "../../firebase-config";
import { TeamTable } from "../shared/TeamTable";
import LeagueButton from "../shared/LeagueButton";
import ImageModal from "../shared/ImageModal";
import EditWeek from "../shared/EditWeek";
import { useLeague } from "../../hooks/query/useLeague";
import "../../CSS/LeaguePages.css";
import {
  LineupSettings,
  FinalizedPlayer,
  Week,
  Position,
  TeamWeekInfo,
} from "@ff-mern/ff-types";
import { useTeamTable } from "../../hooks/useTeamTable";
import { Header } from "./Header";
import { getWeeklyLineup } from "../utils/getWeeklyLineup";
import { useNflSchedule } from "../../hooks/query/useNflSchedule";
import { useNflDefenseStats } from "../../hooks/query/useNflDefenseStats";
import { DisplayLastUpdated } from "./DisplayLastUpdated";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { useAuthUser } from "@react-query-firebase/auth";
import { useSingleTeam } from "../../hooks/query/useSingleTeam";
import { useUpdateSingleTeamMutation } from "../../hooks/query/useUpdateSingleTeamMutation";
import { SuperflexModal } from "./SuperflexModal";

const usedSuperflexLineups = (weekInfo: TeamWeekInfo[]) =>
  weekInfo.reduce((acc, info) => {
    if (info.isSuperflex) {
      return acc + 1;
    }
    return acc;
  }, 0);

const TeamPage = () => {
  const { id, leagueId } = useParams() as { id: string; leagueId: string };
  const { league } = useLeague(leagueId);
  const { team } = useSingleTeam(id);
  const user = useAuthUser(["user"], auth);
  const scheduleQuery = useNflSchedule();
  const defenseStatsQuery = useNflDefenseStats();
  const updateTeamMutation = useUpdateSingleTeamMutation(id);
  const [week, setWeek] = useState(1);
  const [showImageModal, setShowModal] = useState(false);
  const [superflexLineup, setSuperFlexLineup] = useState<LineupSettings>();
  const [showSuperflexModal, setShowSuperflexModal] = useState(false);
  const lineup = useMemo(
    () =>
      getWeeklyLineup(week, team, superflexLineup || league?.lineupSettings),
    [week, team, superflexLineup, league]
  );
  const numSuperflexUsed = useMemo(() => {
    if (team) {
      return usedSuperflexLineups(team.weekInfo);
    }
    return 0;
  }, [team]);
  const { handlePlayerChange, handleBenchPlayer } = useTeamTable();

  useEffect(() => {
    if (league) {
      setWeek(
        league.lastScoredWeek + 1 < league.numWeeks
          ? league.lastScoredWeek + 1
          : league.lastScoredWeek
      );
    }
  }, [league]);

  const handleInfoSubmission = (imageUrl: string, teamName?: string) => {
    if (
      team &&
      imageUrl !== team!.logo &&
      imageUrl !== process.env.REACT_APP_DEFAULT_LOGO
    ) {
      uploadString(ref(storage, `${team!.id}/logo`), imageUrl, "data_url").then(
        (snapshot) => {
          getDownloadURL(snapshot.ref).then((url) => {
            setShowModal(false);
            const tempTeam = { ...team };
            tempTeam.logo = url;
            updateTeamMutation.mutate(tempTeam);
          });
        }
      );
    } else {
      setShowModal(false);
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

  const handleSuperflexUpdate = (
    addedPos: Position | "None",
    removedPos: Position
  ) => {
    if (league && team && addedPos !== "None") {
      let newLineup = { ...league?.lineupSettings };
      newLineup[addedPos] += 1;
      newLineup[removedPos] -= 1;
      team.weekInfo[week].isSuperflex = false; // Just generate a normal lineup with new settings first.
      team.weekInfo[week].finalizedLineup = getWeeklyLineup(
        week,
        team,
        newLineup
      );
      team.weekInfo[week].isSuperflex = true;
      updateTeamMutation.mutate(team);
      setShowSuperflexModal(false);
      setSuperFlexLineup(newLineup);
    } else if (league && team) {
      team.weekInfo[week].isSuperflex = false;
      team.weekInfo[week].finalizedLineup = getWeeklyLineup(
        week,
        team,
        league.lineupSettings
      );
      updateTeamMutation.mutate(team);
      setShowSuperflexModal(false);
      setSuperFlexLineup(undefined);
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
      {team && league && user.isSuccess ? (
        <>
          <Header team={team} showModal={setShowModal} />
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
                  <Button onClick={() => setShowModal(true)}>
                    Change/Set Team Logo
                  </Button>
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
                week > (league.lastScoredWeek || -1)
              }
              players={lineup}
              positionsInTable={league.lineupSettings}
              nflSchedule={scheduleQuery.data?.schedule}
              nflDefenseStats={defenseStatsQuery.data?.data}
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
                week > (league.lastScoredWeek || -1)
              }
              players={lineup}
              positionsInTable={{ bench: 1 } as LineupSettings}
              nflSchedule={scheduleQuery.data?.schedule}
              nflDefenseStats={defenseStatsQuery.data?.data}
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
