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

type TeamTableProps = {
  players: FinalizedLineup;
  positionsInTable: LineupSettings;
  nflSchedule?: NFLSchedule;
  nflDefenseStats?: TeamFantasyPositionPerformance;
  name: TableType;
  week: Week;
  isOwner: boolean;
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

export const TeamTable = ({
  players,
  positionsInTable,
  nflSchedule,
  nflDefenseStats,
  name,
  week,
  isOwner,
  handlePlayerChange,
  handleBenchPlayer,
  teamId,
  showScores = false,
  leagueId,
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
            <th className="text-center">Stats</th>
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
                return (
                  <tr
                    key={
                      player.position +
                      player.lineup +
                      player.fullName +
                      i.toString()
                    }
                    className={hasPlayerAlreadyPlayed(opponentTeam && opponentTeam[week] && opponentTeam[week].gameTime) ? 'player-played' : ''}
                  >
                    {isOwner ? (
                      <td className="centered-td align-middle">
                        <PlayerActionButton
                          player={player}
                          oppositePlayers={findOppositePlayers(player, name === "starters", players)}
                          disabled={hasPlayerAlreadyPlayed(opponentTeam?.[week]?.gameTime)}
                          handlePlayerChange={handlePlayerChange}
                          handleBenchPlayer={handleBenchPlayer}
                          teamId={teamId}
                          actionType="move"
                          tableType={name}
                        />
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
                          disabled={hasPlayerAlreadyPlayed(opponentTeam?.[week]?.gameTime)}
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