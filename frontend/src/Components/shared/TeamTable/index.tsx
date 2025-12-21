import React, { useMemo, useRef } from "react";
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
import { useDrag, useDrop } from "react-dnd";

type TableType = "starters" | "bench" | "backup";

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

const dndItemType = "lineup-player";

type LineupDragItem = {
  player: FinalizedPlayer;
  sourceTable: TableType;
  sourceIndex: number;
  sourceLineup: Position;
};

const slotAllowsPosition = (slot: Position, playerPosition: string) => {
  if (slot === "bench") return true;
  return slot.indexOf(playerPosition) >= 0;
};

type TeamTableRowProps = {
  player: FinalizedPlayer;
  rowIndex: number;
  slot: Position;
  name: TableType;
  week: Week;
  isOwner: boolean;
  nflDefenseStats?: TeamFantasyPositionPerformance;
  opponentTeam?: TeamSchedule;
  disabled: boolean;
  showScores: boolean;
  teamId?: string;
  oppositePlayers: FinalizedPlayer[];
  backupOppositePlayers: FinalizedPlayer[];
  handlePlayerChange: TeamTableProps["handlePlayerChange"];
  handleBenchPlayer: TeamTableProps["handleBenchPlayer"];
  playerScores?: ReturnType<typeof usePlayerScores>["data"];
};

const TeamTableRow = ({
  player,
  rowIndex,
  slot,
  name,
  week,
  isOwner,
  nflDefenseStats,
  opponentTeam,
  disabled,
  showScores,
  teamId,
  oppositePlayers,
  backupOppositePlayers,
  handlePlayerChange,
  handleBenchPlayer,
  playerScores,
}: TeamTableRowProps) => {
  const canDrag = isOwner && !disabled && player.fullName !== "";
  const rowRef = useRef<HTMLTableRowElement>(null);

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: dndItemType,
      item: {
        player,
        sourceTable: name,
        sourceIndex: rowIndex,
        sourceLineup: player.lineup as Position,
      },
      canDrag,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [canDrag, name, player, rowIndex]
  );

  const [{ canDrop, isOver }, drop] = useDrop(
    () => ({
      accept: dndItemType,
      canDrop: (item: unknown) => {
        if (!isOwner || disabled) return false;
        const dragItem = item as LineupDragItem;
        if (dragItem.player.fullName === "") return false;
        if (dragItem.player.fullName === player.fullName && dragItem.sourceLineup === slot) {
          return false;
        }

        const isTargetBench = slot === "bench";
        const isSourceBench = dragItem.sourceLineup === "bench";

        if (!isTargetBench && !isSourceBench) {
          if (player.fullName === "") return false;
          if (!slotAllowsPosition(slot, dragItem.player.position)) return false;
          if (!slotAllowsPosition(dragItem.sourceLineup, player.position)) return false;
          return true;
        }

        if (!isTargetBench) {
          return slotAllowsPosition(slot, dragItem.player.position);
        }

        return true;
      },
      drop: (item: unknown) => {
        const dragItem = item as LineupDragItem;
        if (!isOwner || disabled) return;
        if (dragItem.player.fullName === "") return;
        if (dragItem.player.fullName === player.fullName && dragItem.sourceLineup === slot) return;

        handlePlayerChange(
          dragItem.player,
          dragItem.sourceTable,
          player,
          dragItem.sourceIndex,
          teamId
        );
      },
      collect: (monitor) => ({
        canDrop: monitor.canDrop(),
        isOver: monitor.isOver({ shallow: true }),
      }),
    }),
    [disabled, handlePlayerChange, isOwner, player, slot, teamId]
  );

  drag(rowRef);
  drop(rowRef);

  const rowClassName = [
    disabled ? "player-played" : "",
    canDrop ? "lineup-drop-valid" : "",
    canDrop && isOver ? "lineup-drop-over" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <tr ref={rowRef} className={rowClassName} style={isDragging ? { opacity: 0.5 } : undefined}>
      {isOwner ? (
        <td className="centered-td align-middle">
          <PlayerActionButton
            player={player}
            oppositePlayers={oppositePlayers}
            disabled={disabled}
            selectedIndex={rowIndex}
            handlePlayerChange={handlePlayerChange}
            handleBenchPlayer={handleBenchPlayer}
            teamId={teamId}
            actionType="move"
            tableType={name}
          />
        </td>
      ) : null}
      <td className="centered-td align-middle">
        <span>{name === "starters" ? player.lineup : player.position}</span>
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
            ) : (
              "n/a"
            )}
          </div>
        </td>
      )}
      {showScores && (
        <td className="centered-td align-middle">
          {playerScores?.players[player.sanitizedName]?.scoring?.totalPoints?.toFixed(1) || "0.00"}
        </td>
      )}
      <td className="centered-td align-middle">
        {getStatBreakdown(
          player.position as SinglePosition,
          playerScores?.players[player.sanitizedName] as StoredPlayerInformation
        )}
      </td>
      {isOwner && name === "starters" ? (
        <td>
          <PlayerActionButton
            player={player}
            oppositePlayers={backupOppositePlayers}
            disabled={disabled}
            selectedIndex={rowIndex}
            handlePlayerChange={handlePlayerChange}
            teamId={teamId}
            actionType="backup"
            tableType={name}
          />
        </td>
      ) : null}
    </tr>
  );
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
}: TeamTableProps) => {
  const iterablePositions = useMemo(
    () =>
      Object.keys(positionsInTable)
        .reduce((acc: Position[], pos: string) => {
          acc = acc.concat([...Array<Position>(1).fill(pos as Position)]);
          return acc;
        }, [])
        .sort(lineupSorter),
    [positionsInTable]
  );
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
                if (nflSchedule && player.team !== "None" && AbbreviationToFullTeam[player.team] in nflSchedule) {
                  opponentTeam = nflSchedule[AbbreviationToFullTeam[player.team]];
                }
                const disabled = !isAdmin && hasPlayerAlreadyPlayed(opponentTeam?.[week]?.gameTime);
                const oppositePlayers = findOppositePlayers(player, name === "starters", players);
                const backupOppositePlayers = findOppositePlayers(player, true, players);

                return (
                  <TeamTableRow
                    key={player.position + player.lineup + player.fullName + i.toString()}
                    player={player}
                    rowIndex={i}
                    slot={pos}
                    name={name}
                    week={week}
                    isOwner={isOwner}
                    nflDefenseStats={nflDefenseStats}
                    opponentTeam={opponentTeam}
                    disabled={disabled}
                    showScores={showScores}
                    teamId={teamId}
                    oppositePlayers={oppositePlayers}
                    backupOppositePlayers={backupOppositePlayers}
                    handlePlayerChange={handlePlayerChange}
                    handleBenchPlayer={handleBenchPlayer}
                    playerScores={playerScores}
                  />
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