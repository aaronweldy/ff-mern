import React from "react";
import { Table, Dropdown, DropdownButton, SplitButton } from "react-bootstrap";
import {
  FinalizedLineup,
  FinalizedPlayer,
  LineupSettings,
  Position,
} from "@ff-mern/ff-types";
import { lineupSorter } from "../../constants";

type TableType = "starters" | "bench" | "backup";

type TeamTableProps = {
  players: FinalizedLineup;
  positionsInTable: LineupSettings;
  name: TableType;
  isOwner: boolean;
  handlePlayerChange: (
    player: FinalizedPlayer,
    name: TableType,
    opp: FinalizedPlayer,
    sidx: number
  ) => void;
  handleBenchPlayer: (player: FinalizedPlayer) => void;
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
  name,
  isOwner,
  handlePlayerChange,
  handleBenchPlayer,
}: TeamTableProps) => {
  const iterablePositions = Object.keys(positionsInTable)
    .reduce((acc: Position[], pos: string) => {
      acc = acc.concat([...Array<Position>(1).fill(pos as Position)]);
      return acc;
    }, [])
    .sort(lineupSorter);

  return (
    <Table striped bordered hover>
      <thead>
        <tr>
          {isOwner ? <th>Move</th> : null}
          <th>Position</th>
          <th>Player Name</th>
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
                    player.position + player.lineup + player.name + i.toString()
                  }
                >
                  {isOwner ? (
                    <td>
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
                                handlePlayerChange(player, name, oppPlayer, i)
                              }
                            >
                              {oppPlayer.lineup}: {oppPlayer.name}
                            </Dropdown.Item>
                          );
                        })}
                        {name === "starters" && player.name !== "" ? (
                          <Dropdown.Item
                            onClick={() => handleBenchPlayer(player)}
                          >
                            bench
                          </Dropdown.Item>
                        ) : null}
                      </DropdownButton>
                    </td>
                  ) : null}
                  <td>
                    <span>
                      {name === "starters" ? player.lineup : player.position}
                    </span>
                  </td>
                  <td>
                    <span>{player.name}</span>
                  </td>
                  {isOwner && name === "starters" ? (
                    <td>
                      <SplitButton
                        id="backup"
                        title={!player.backup ? "None" : player.backup}
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
                                    -1
                                  )
                                }
                              >
                                {oppPlayer.name}
                              </Dropdown.Item>
                            );
                          }
                        )}
                        <Dropdown.Item
                          onClick={() =>
                            handlePlayerChange(
                              player,
                              "backup",
                              new FinalizedPlayer("", player.position, "bench"),
                              -1
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
  );
};
