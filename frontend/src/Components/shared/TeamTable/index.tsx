import React from "react";
import { Table } from "react-bootstrap";
import {
  AbbreviationToFullTeam,
  FinalizedLineup,
  FinalizedPlayer,
  LineupSettings,
  playerTeamIsNflAbbreviation,
  Position,
  TeamFantasyPositionPerformance,
  Week,
  lineupSorter,
  NFLSchedule,
  TeamSchedule,
  SinglePosition,
  StoredPlayerInformation,
} from "@ff-mern/ff-types";
import { InlineTeamTile } from "../InlineTeamTile";
import { usePlayerScores } from "../../../hooks/query/usePlayerScores";
import { PlayerActionButton } from '../PlayerActionButton';
import { MatchupOverlay } from '../MatchupOverlay';
import { getStatBreakdown } from "../../../utils/statBreakdown";

type TableType = "starters" | "bench" | "backup";

export type LineupDragState = {
  lineup: Position;
  index: number;
};

type TeamTableProps = {
  players: FinalizedLineup;
  positionsInTable: LineupSettings;
  nflSchedule?: NFLSchedule;
  nflDefenseStats?: TeamFantasyPositionPerformance;
  name: TableType;
  week: Week;
  isOwner: boolean;
  isAdmin?: boolean;
  handlePlayerChange: (
    player: FinalizedPlayer,
    name: TableType,
    opp: FinalizedPlayer,
    sidx: number,
    teamId?: string
  ) => void;
  handleBenchPlayer: (player: FinalizedPlayer, teamId?: string) => void;
  teamId?: string;
  showScores?: boolean;
  leagueId?: string;
  dragState?: LineupDragState | null;
  setDragState?: (state: LineupDragState | null) => void;
  onDragSwap?: (args: {
    fromLineup: Position;
    fromIndex: number;
    toLineup: Position;
    toIndex: number;
  }) => void;
};

const findOppositePlayers = (
  player: FinalizedPlayer,
  isStarter: boolean,
  allPlayers: FinalizedLineup
) => {
  if (isStarter) {
    return allPlayers["bench"].filter(
      (benchPlayer) => player.lineup.indexOf(benchPlayer.position) >= 0
    );
  }
  return Object.keys(allPlayers)
    .filter((pos) => pos.indexOf(player.position) >= 0)
    .reduce((acc: FinalizedPlayer[], position: string) => {
      acc = acc.concat(allPlayers[position as Position]);
      return acc;
    }, []);
};

const hasPlayerAlreadyPlayed = (gameTime: string | undefined): boolean => {
  if (!gameTime) return false;
  const now = new Date();
  const gameDate = new Date(gameTime);
  return now > gameDate;
};

const canPlayerFitLineup = (player: FinalizedPlayer, lineup: string) => {
  if (lineup === "bench") {
    return true;
  }
  return lineup.split("/").includes(player.position);
};

const getDragData = (e: React.DragEvent) => {
  const raw =
    e.dataTransfer.getData("application/x-lineup-drag") ||
    e.dataTransfer.getData("text/plain");
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as { lineup?: Position; index?: number };
    if (!parsed.lineup || typeof parsed.index !== "number") {
      return null;
    }
    return { lineup: parsed.lineup, index: parsed.index };
  } catch {
    return null;
  }
};

export const TeamTable = ({
  players,
  positionsInTable,
  nflSchedule,
  nflDefenseStats,
  name,
  week,
  isOwner,
  isAdmin = false,
  handlePlayerChange,
  handleBenchPlayer,
  teamId,
  showScores = false,
  leagueId,
  dragState,
  setDragState,
  onDragSwap,
}: TeamTableProps) => {
  const iterablePositions = Object.keys(positionsInTable)
    .reduce((acc: Position[], pos: string) => {
      acc = acc.concat([...Array<Position>(1).fill(pos as Position)]);
      return acc;
    }, [])
    .sort(lineupSorter);
  const { data: playerScores } = usePlayerScores(leagueId || "", parseInt(week));
  return (
    <div className="team-table-wrapper">
      <Table striped bordered hover className="w-auto left-scrollable-table">
        <thead>
          <tr>
            {isOwner ? <th>Move</th> : null}
            <th className="text-center">Position</th>
            <th className="text-center">Player</th>
            <th className="text-center">Matchup</th>
            {showScores && <th className="text-center">Points</th>}
            {showScores && <th className="text-center">Stats</th>}
            {isOwner && name === "starters" ? <th>Backup</th> : null}
          </tr>
        </thead>
        <tbody>
          {iterablePositions.reduce((acc: JSX.Element[], pos: Position) => {
            if (positionsInTable[pos] === 0) {
              return acc;
            }
            const newRows = players[pos];
            acc = acc.concat(
              newRows.map((player, i) => {
                let opponentTeam: TeamSchedule | undefined = undefined;
                if (nflSchedule && player.team !== 'None' && AbbreviationToFullTeam[player.team] in nflSchedule) {
                  opponentTeam = nflSchedule[AbbreviationToFullTeam[player.team]]
                }
                const playerLocked = !isAdmin && hasPlayerAlreadyPlayed(opponentTeam?.[week]?.gameTime);
                const dragSource =
                  !!dragState &&
                  dragState.lineup === (player.lineup as Position) &&
                  dragState.index === i;
                const fromPlayer =
                  dragState ? (players[dragState.lineup]?.[dragState.index] as FinalizedPlayer | undefined) : undefined;
                const canDrop =
                  !!fromPlayer &&
                  fromPlayer.fullName !== "" &&
                  !dragSource &&
                  !playerLocked &&
                  canPlayerFitLineup(fromPlayer, player.lineup) &&
                  (player.fullName === "" || canPlayerFitLineup(player, fromPlayer.lineup));
                const canDrag =
                  isOwner &&
                  !!setDragState &&
                  !!onDragSwap &&
                  player.fullName !== "" &&
                  !playerLocked;
                return (
                  <tr
                    key={
                      player.position +
                      player.lineup +
                      player.fullName +
                      i.toString()
                    }
                    className={[
                      playerLocked ? "player-played" : "",
                      dragSource ? "lineup-drag-source" : "",
                      canDrop ? "lineup-drop-valid" : "",
                    ].filter(Boolean).join(" ")}
                    onDragOver={(e) => {
                      const activeDrag = dragState ?? getDragData(e);
                      if (!activeDrag) {
                        return;
                      }
                      const activeFromPlayer = players[activeDrag.lineup]?.[activeDrag.index] as FinalizedPlayer | undefined;
                      const canDropNow =
                        !!activeFromPlayer &&
                        activeFromPlayer.fullName !== "" &&
                        !(activeDrag.lineup === (player.lineup as Position) && activeDrag.index === i) &&
                        !playerLocked &&
                        canPlayerFitLineup(activeFromPlayer, player.lineup) &&
                        (player.fullName === "" || canPlayerFitLineup(player, activeFromPlayer.lineup));
                      if (!canDropNow) {
                        return;
                      }
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      if (!dragState) {
                        setDragState?.(activeDrag);
                      }
                    }}
                    onDrop={(e) => {
                      const activeDrag = dragState ?? getDragData(e);
                      if (!activeDrag || !onDragSwap) {
                        return;
                      }
                      e.preventDefault();
                      onDragSwap({
                        fromLineup: activeDrag.lineup,
                        fromIndex: activeDrag.index,
                        toLineup: player.lineup as Position,
                        toIndex: i,
                      });
                      setDragState?.(null);
                    }}
                  >
                    {isOwner ? (
                      <td className="centered-td align-middle">
                        <div className="d-flex align-items-center justify-content-center">
                          {canDrag ? (
                            <span
                              className="lineup-drag-handle mr-2"
                              draggable
                              onDragStart={(e) => {
                                if (!setDragState) {
                                  return;
                                }
                                e.dataTransfer.effectAllowed = "move";
                                e.dataTransfer.setData(
                                  "application/x-lineup-drag",
                                  JSON.stringify({ lineup: player.lineup, index: i })
                                );
                                e.dataTransfer.setData(
                                  "text/plain",
                                  JSON.stringify({ lineup: player.lineup, index: i })
                                );
                                setDragState({ lineup: player.lineup as Position, index: i });
                              }}
                              onDragEnd={() => {
                                setDragState?.(null);
                              }}
                            >
                              ⠿
                            </span>
                          ) : null}
                          <PlayerActionButton
                            player={player}
                            oppositePlayers={findOppositePlayers(player, name === "starters", players)}
                            disabled={playerLocked}
                            handlePlayerChange={handlePlayerChange}
                            handleBenchPlayer={handleBenchPlayer}
                            teamId={teamId}
                            actionType="move"
                            tableType={name}
                          />
                        </div>
                      </td>
                    ) : null}
                    <td className="centered-td align-middle">
                      <span>
                        {name === "starters" ? player.lineup : player.position}
                      </span>
                    </td>
                    <td className="centered-td align-middle">
                      <div className="d-flex align-items-center">
                        <InlineTeamTile team={player.team} showName={false} />
                        <span className="flex-nowrap ml-2">{player.fullName}</span>
                      </div>
                    </td>
                    {nflDefenseStats && (
                      <td className="centered-td align-middle">
                        <div>
                          {opponentTeam && playerTeamIsNflAbbreviation(player.team) ? (
                            <MatchupOverlay
                              player={player}
                              opponentTeam={opponentTeam}
                              week={week}
                              nflDefenseStats={nflDefenseStats}
                            />
                          ) : 'n/a'}
                        </div>
                      </td>
                    )}
                    {showScores && (
                      <td className="centered-td align-middle">
                        {playerScores?.players[player.sanitizedName]?.scoring?.totalPoints?.toFixed(1) || '0.00'}
                      </td>
                    )}
                    <td className="centered-td align-middle">
                      {getStatBreakdown(player.position as SinglePosition, playerScores?.players[player.sanitizedName] as StoredPlayerInformation)}
                    </td>
                    {isOwner && name === "starters" ? (
                      <td>
                        <PlayerActionButton
                          player={player}
                          oppositePlayers={findOppositePlayers(player, true, players)}
                          disabled={playerLocked}
                          handlePlayerChange={handlePlayerChange}
                          teamId={teamId}
                          actionType="backup"
                          tableType={name}
                        />
                      </td>
                    ) : null}
                  </tr>
                );
              })
            );
            return acc;
          }, [])}
        </tbody>
      </Table>
    </div>
  );
};