import React from "react";
import { Table, Dropdown, DropdownButton, SplitButton } from "react-bootstrap";
import {
  AbbreviatedNflTeam,
  AbbreviationToFullTeam,
  FinalizedLineup,
  FinalizedPlayer,
  LineupSettings,
  Position,
  sanitizeNflScheduleTeamName,
  TeamFantasyPositionPerformance,
  TeamToSchedule,
  Week,
} from "@ff-mern/ff-types";
import { lineupSorter } from "../../constants";
import { NflRankedText } from "./NflRankedText";
import { capitalizePlayerName } from "../utils/capitalizePlayerName";

type TableType = "starters" | "bench" | "backup";

type TeamTableProps = {
  players: FinalizedLineup;
  positionsInTable: LineupSettings;
  nflSchedule?: TeamToSchedule;
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
    <div className="table-wrapper">
      <Table striped bordered hover className="w-auto scrollable-table">
        <thead>
          <tr>
            {isOwner ? <th>Move</th> : null}
            <th>Position</th>
            <th>Player Name</th>
            <th>Team</th>
            <th>Matchup</th>
            <th>Matchup vs. Position</th>
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
                return (
                  <tr
                    key={
                      player.position +
                      player.lineup +
                      player.name +
                      i.toString()
                    }
                  >
                    {isOwner ? (
                      <td className="centered-td align-middle">
                        <DropdownButton title="Move">
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
                                  oppPlayer.name +
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
                                {oppPlayer.lineup}:{" "}
                                {capitalizePlayerName(oppPlayer.name)}
                              </Dropdown.Item>
                            );
                          })}
                          {name === "starters" && player.name !== "" ? (
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
                      <span className="flex-nowrap">
                        {capitalizePlayerName(player.name)}
                      </span>
                    </td>
                    <td className="centered-td align-middle">
                      <span>{player.team}</span>
                    </td>
                    {nflSchedule && nflDefenseStats && (
                      <>
                        <td className="centered-td align-middle">
                          <div>
                            {player.team ? nflSchedule[player.team][week] : ""}
                          </div>
                        </td>
                        <td className="centered-td align-middle">
                          {player.team &&
                          nflSchedule[player.team][week] !== "BYE" ? (
                            <NflRankedText
                              rank={
                                nflDefenseStats[
                                  AbbreviationToFullTeam[
                                    sanitizeNflScheduleTeamName(
                                      nflSchedule[player.team][week]
                                    ) as AbbreviatedNflTeam
                                  ]
                                ][player.position]
                              }
                            />
                          ) : (
                            "n/a"
                          )}
                        </td>
                      </>
                    )}
                    {isOwner && name === "starters" ? (
                      <td>
                        <SplitButton
                          id="backup"
                          title={
                            !player.backup
                              ? "None"
                              : capitalizePlayerName(player.backup)
                          }
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
                                  {capitalizePlayerName(oppPlayer.name)}
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
