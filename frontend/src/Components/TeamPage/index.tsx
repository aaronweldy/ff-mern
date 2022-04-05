import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Container, Row } from "react-bootstrap";
import { auth, storage } from "../../firebase-config";
import { TeamTable } from "../shared/TeamTable";
import LeagueButton from "../shared/LeagueButton";
import ImageModal from "../shared/ImageModal";
import EditWeek from "../shared/EditWeek";
import { useLeague } from "../../hooks/query/useLeague";
import "../../CSS/LeaguePages.css";
import { LineupSettings, FinalizedPlayer, Week } from "@ff-mern/ff-types";
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
  const lineup = getWeeklyLineup(week, team, league?.lineupSettings);
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
          <Header
            team={team}
            isOwner={user.data?.uid === team.owner}
            showModal={setShowModal}
          />
          <EditWeek
            week={week}
            maxWeeks={(league && league.numWeeks) || 18}
            onChange={(e) => setWeek(parseInt(e.target.value))}
          />
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
        </>
      ) : (
        ""
      )}
    </Container>
  );
};

export default TeamPage;
