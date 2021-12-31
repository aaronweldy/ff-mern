import React from "react";
import { Table, Dropdown, DropdownButton, SplitButton } from "react-bootstrap";
import { LocalPlayer } from "../ff-types/types";

type TableType = "starters" | "bench" | "backup";

type TeamTableProps = {
  players: LocalPlayer[];
  oppPlayers: LocalPlayer[];
  name: TableType;
  week: number;
  isOwner: boolean;
  handlePlayerChange: (
    player: LocalPlayer,
    name: TableType,
    opp: LocalPlayer
  ) => void;
  handleBenchPlayer: (player: LocalPlayer, idx: number) => void;
};

export default function TeamTable({
  players,
  oppPlayers,
  name,
  week,
  isOwner,
  handlePlayerChange,
  handleBenchPlayer,
}: TeamTableProps) {
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
        {players.map((player, i) => (
          <tr key={i}>
            {isOwner ? (
              <td>
                <DropdownButton title="">
                  {oppPlayers
                    .filter(
                      (oppPlayer) =>
                        oppPlayer.lineup[week].indexOf(player.position) >= 0 ||
                        player.lineup[week].indexOf(oppPlayer.position) >= 0
                    )
                    .map((starter, j) => {
                      console.log(oppPlayers);
                      console.log(player);
                      console.log(starter);
                      const swapPlayer = oppPlayers.findIndex(
                        (oppPlayer) =>
                          oppPlayer.name === starter.name &&
                          oppPlayer.position === starter.position
                      );
                      return (
                        <Dropdown.Item
                          key={j}
                          onClick={() =>
                            handlePlayerChange(
                              player,
                              name,
                              oppPlayers[swapPlayer]
                            )
                          }
                        >
                          {starter.lineup[week]}:{starter.name}
                        </Dropdown.Item>
                      );
                    })}
                  {name === "starters" && player.name !== "" ? (
                    <Dropdown.Item onClick={() => handleBenchPlayer(player, i)}>
                      bench
                    </Dropdown.Item>
                  ) : null}
                </DropdownButton>
              </td>
            ) : null}
            <td>
              <span>
                {name === "starters" ? player.lineup[week] : player.position}
              </span>
            </td>
            <td>
              <span>{player.name}</span>
            </td>
            {isOwner && name === "starters" ? (
              <td>
                <SplitButton
                  id="backup"
                  title={
                    player.backup[week] === "" ? "None" : player.backup[week]
                  }
                  variant="secondary"
                >
                  {oppPlayers
                    .filter(
                      (oppPlayer) =>
                        oppPlayer.lineup[week].indexOf(player.position) >= 0 ||
                        player.lineup[week].indexOf(oppPlayer.position) >= 0
                    )
                    .map((starter, j) => {
                      const swapPlayer = oppPlayers.findIndex(
                        (oppPlayer) =>
                          oppPlayer.name === starter.name &&
                          oppPlayer.position === starter.position
                      );
                      return (
                        <Dropdown.Item
                          key={j}
                          onClick={() =>
                            handlePlayerChange(
                              player,
                              "backup",
                              oppPlayers[swapPlayer]
                            )
                          }
                        >
                          {starter.name}
                        </Dropdown.Item>
                      );
                    })}
                  <Dropdown.Item
                    onClick={() =>
                      handlePlayerChange(
                        player,
                        "backup",
                        new LocalPlayer(
                          "",
                          player.position,
                          "bench",
                          player.weekStats.length,
                          true
                        )
                      )
                    }
                  >
                    None
                  </Dropdown.Item>
                </SplitButton>
              </td>
            ) : null}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
