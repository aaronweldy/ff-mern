import React from "react";
import { Table, Dropdown, DropdownButton, SplitButton, OverlayTrigger, Tooltip } from "react-bootstrap";
import {
  AbbreviatedNflTeam,
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
} from "@ff-mern/ff-types";
import { NflRankedText } from "../NflRankedText";
import { InlineTeamTile } from "../InlineTeamTile";

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

const formatNflOpponent = (opp: TeamSchedule | undefined, week: Week, withHomeAway = false) => {
  if (!opp) {
    return "n/a"
  }
  if (week in opp) {
    if (withHomeAway) {
      return opp[week].isHome ? opp[week].opponent : `@${opp[week].opponent}`;
    }
    return opp[week].opponent;
  }
  return "BYE";
}

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
}: TeamTableProps) => {
  const iterablePositions = Object.keys(positionsInTable)
    .reduce((acc: Position[], pos: string) => {
      acc = acc.concat([...Array<Position>(1).fill(pos as Position)]);
      return acc;
    }, [])
    .sort(lineupSorter);
  return (
    <div className="team-table-wrapper">
      <Table striped bordered hover className="w-auto left-scrollable-table">
        <thead>
          <tr>
            {isOwner ? <th>Move</th> : null}
            <th className="text-center">Position</th>
            <th className="text-center">Player</th>
            <th className="text-center">Matchup</th>
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
                if (nflSchedule && player.team in nflSchedule) {
                  if (player.team) {
                    opponentTeam = nflSchedule[player.team]
                  }
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
                        <DropdownButton title="Move" disabled={hasPlayerAlreadyPlayed(opponentTeam?.[week]?.gameTime)}>
                          {findOppositePlayers(
                            player,
                            name === "starters",
                            players
                          ).map((oppPlayer, j) => {
                            return (
                              <Dropdown.Item
                                key={
                                  oppPlayer.position +
                                  oppPlayer.lineup +
                                  oppPlayer.fullName +
                                  j.toString()
                                }
                                onClick={() =>
                                  handlePlayerChange(
                                    player,
                                    name,
                                    oppPlayer,
                                    i,
                                    teamId
                                  )
                                }
                              >
                                {oppPlayer.lineup}: {oppPlayer.fullName}
                              </Dropdown.Item>
                            );
                          })}
                          {name === "starters" && player.fullName !== "" ? (
                            <Dropdown.Item
                              onClick={() => handleBenchPlayer(player, teamId)}
                            >
                              bench
                            </Dropdown.Item>
                          ) : null}
                        </DropdownButton>
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
                    {nflSchedule && nflDefenseStats && (
                      <>
                        <td className="centered-td align-middle">
                          <div>
                            {player.team && playerTeamIsNflAbbreviation(player.team) ? (
                              <OverlayTrigger
                                placement="top"
                                overlay={
                                  <Tooltip id={`tooltip-${player.fullName}`}>
                                    Matchup vs. Position: {
                                      playerTeamIsNflAbbreviation(formatNflOpponent(opponentTeam, week)) &&
                                        formatNflOpponent(opponentTeam, week) !== "BYE" ? (
                                        <NflRankedText
                                          rank={
                                            nflDefenseStats[
                                            AbbreviationToFullTeam[formatNflOpponent(opponentTeam, week) as AbbreviatedNflTeam]
                                            ][player.position]
                                          }
                                        />
                                      ) : (
                                        "n/a"
                                      )
                                    }
                                  </Tooltip>
                                }
                              >
                                <div className="d-flex flex-column align-items-center">
                                  <InlineTeamTile
                                    team={formatNflOpponent(opponentTeam, week, true) as AbbreviatedNflTeam}
                                  />
                                  <small>
                                    {opponentTeam && opponentTeam[week]?.gameTime && (
                                      <span className="text-muted">
                                        {new Date(opponentTeam[week].gameTime).toLocaleString(undefined, {
                                          weekday: 'short',
                                          hour: 'numeric',
                                          minute: '2-digit',
                                          timeZoneName: 'short'
                                        })}
                                      </span>
                                    )}
                                  </small>
                                </div>
                              </OverlayTrigger>
                            ) : 'n/a'}
                          </div>
                        </td>
                      </>
                    )}
                    {isOwner && name === "starters" ? (
                      <td>
                        <SplitButton
                          id="backup"
                          title={!player.backup ? "None" : player.backup}
                          disabled={hasPlayerAlreadyPlayed(opponentTeam?.[week]?.gameTime)}
                          variant="secondary"
                        >
                          {findOppositePlayers(player, true, players).map(
                            (oppPlayer, j) => {
                              return (
                                <Dropdown.Item
                                  key={j}
                                  onClick={() =>
                                    handlePlayerChange(
                                      player,
                                      "backup",
                                      oppPlayer,
                                      -1,
                                      teamId
                                    )
                                  }
                                >
                                  {oppPlayer.fullName}
                                </Dropdown.Item>
                              );
                            }
                          )}
                          <Dropdown.Item
                            onClick={() =>
                              handlePlayerChange(
                                player,
                                "backup",
                                new FinalizedPlayer(
                                  "",
                                  player.position,
                                  "" as AbbreviatedNflTeam,
                                  "bench"
                                ),
                                -1,
                                teamId
                              )
                            }
                          >
                            None
                          </Dropdown.Item>
                        </SplitButton>
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