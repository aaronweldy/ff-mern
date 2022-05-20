import { buildTrade, RosteredPlayer, Team } from "@ff-mern/ff-types";
import { useAuthUser } from "@react-query-firebase/auth";
import { useEffect, useMemo, useState } from "react";
import { Col, Row } from "react-bootstrap";
import { useParams } from "react-router-dom";
import { auth } from "../../../firebase-config";
import { useTradeMutations } from "../../../hooks/query/useTradeMutations";
import { useTeams } from "../../../hooks/query/useTeams";
import { TeamSelectionDropdown } from "../../shared/TeamSelectionDropdown";
import { ActiveTradeView } from "./ActiveTradeView";
import { TeamTradeTable } from "./TeamTradeTable";
import { toast } from "react-toastify";

export const CreateTrade = () => {
  const { id } = useParams() as { id: string };
  const { query: teamsQuery } = useTeams(id);
  const userQuery = useAuthUser("user", auth);
  const [userTeam, setUserTeam] = useState<Team>();
  const [tradeTeam, setTradeTeam] = useState<Team>();
  const [playersInTrade, setPlayersInTrade] = useState<
    Record<string, RosteredPlayer>[]
  >([{}, {}]);
  const { proposeQuery } = useTradeMutations(id);
  useEffect(() => {
    if (teamsQuery.isSuccess && userQuery.isSuccess) {
      const userTeam = teamsQuery.data.teams.find(
        (team) => team.owner === userQuery.data?.uid
      );
      const tradeTeam = teamsQuery.data.teams.find(
        (team) => team.owner !== userQuery.data?.uid
      );
      if (userTeam && tradeTeam) {
        setUserTeam(userTeam);
        setTradeTeam(tradeTeam);
      }
    }
  }, [
    teamsQuery.isSuccess,
    userQuery.isSuccess,
    teamsQuery.data,
    userQuery.data,
  ]);

  const updateSelectedTeam = (
    e: React.ChangeEvent<HTMLSelectElement>,
    name: "user" | "opp"
  ) => {
    const team = teamsQuery.data?.teams.find(
      (team) => team.id === e.target.value
    );
    if (team) {
      if (name === "user") {
        setUserTeam(team);
        const updatedPlayersInTrade = [...playersInTrade];
        updatedPlayersInTrade[0] = {};
        setPlayersInTrade(updatedPlayersInTrade);
      } else {
        setTradeTeam(team);
        const updatedPlayersInTrade = [...playersInTrade];
        updatedPlayersInTrade[1] = {};
        setPlayersInTrade(updatedPlayersInTrade);
      }
    }
  };
  const handlePlayerSelection = (
    player: RosteredPlayer,
    teamId: string,
    addToTrade: boolean
  ) => {
    const teamIndex = teamId === userTeam?.id ? 0 : 1;
    if (addToTrade) {
      playersInTrade[teamIndex] = {
        ...playersInTrade[teamIndex],
        [player.fullName]: player,
      };
      setPlayersInTrade([...playersInTrade]);
    } else {
      delete playersInTrade[teamIndex][player.fullName];
      setPlayersInTrade([...playersInTrade]);
    }
  };
  const handleTradeSubmission = () => {
    if (userTeam && tradeTeam) {
      const tradeToSend = buildTrade(playersInTrade, [
        userTeam.id,
        tradeTeam.id,
      ]);
      toast.promise(proposeQuery.mutateAsync(tradeToSend), {
        pending: {
          render: "Proposing Trade...",
          position: toast.POSITION.TOP_CENTER,
        },
        success: {
          render: "Trade proposal sent!",
          position: toast.POSITION.TOP_CENTER,
        },
        error: {
          render: "Error sending trade proposal",
          position: toast.POSITION.TOP_CENTER,
        },
      });
    }
  };

  const submitTradeDisabled = useMemo(() => {
    return (
      !userTeam ||
      !tradeTeam ||
      !Object.keys(playersInTrade[0]).length ||
      !Object.keys(playersInTrade[1]).length
    );
  }, [userTeam, tradeTeam, playersInTrade]);
  return (
    <>
      {userTeam && tradeTeam && (
        <>
          <div className="d-flex mt-3 team-selection-row flex-column">
            <Row className="justify-content-center">
              <h3>Create Trade</h3>
            </Row>
            <Row>
              <Col className="d-flex justify-content-end">
                <Row className="flex-column">
                  <div className="trade-row-text">Your Team</div>
                  <TeamSelectionDropdown
                    teams={
                      teamsQuery.data?.teams.filter(
                        (team) => team.id === userTeam?.id
                      ) || []
                    }
                    selectedTeam={userTeam.id}
                    updateTeam={(e) => updateSelectedTeam(e, "user")}
                  />
                </Row>
              </Col>
              <Col className="d-flex ml-3">
                <Row className="flex-column">
                  <div className="trade-row-text">Opponent Team</div>
                  <TeamSelectionDropdown
                    teams={
                      teamsQuery.data?.teams.filter(
                        (team) => team.id !== userTeam?.id
                      ) || []
                    }
                    selectedTeam={tradeTeam.id}
                    updateTeam={(e) => updateSelectedTeam(e, "opp")}
                  />
                </Row>
              </Col>
            </Row>
            <Row className="mt-3">
              <Col className="d-flex justify-content-center">
                <button
                  disabled={submitTradeDisabled}
                  className="submit-button"
                  onClick={handleTradeSubmission}
                >
                  Submit Trade
                </button>
              </Col>
            </Row>
          </div>
          <Row className="mt-3">
            <Col>
              <ActiveTradeView
                team={userTeam}
                currentTrade={playersInTrade[0]}
                onPlayerSelection={handlePlayerSelection}
              />
            </Col>
            <Col>
              <ActiveTradeView
                team={tradeTeam}
                currentTrade={playersInTrade[1]}
                onPlayerSelection={handlePlayerSelection}
              />
            </Col>
          </Row>
        </>
      )}
      <Row>
        <Col>
          {userTeam ? (
            <>
              <h5>Available Players</h5>
              <TeamTradeTable
                team={userTeam}
                playersInTrade={playersInTrade[0]}
                onPlayerSelection={handlePlayerSelection}
              />
            </>
          ) : (
            <div className="spinning-loader" />
          )}
        </Col>
        <Col>
          {tradeTeam ? (
            <>
              <h5>Available Players</h5>
              <TeamTradeTable
                team={tradeTeam}
                playersInTrade={playersInTrade[1]}
                onPlayerSelection={handlePlayerSelection}
              />
            </>
          ) : (
            <div className="spinning-loader" />
          )}
        </Col>
      </Row>
    </>
  );
};
