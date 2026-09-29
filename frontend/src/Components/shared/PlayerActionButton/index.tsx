import React, { useId } from "react";
import { Dropdown } from "react-bootstrap";
import { FinalizedPlayer, AbbreviatedNflTeam } from "@ff-mern/ff-types";

type TableType = "starters" | "bench" | "backup";

interface PlayerActionButtonProps {
  player: FinalizedPlayer;
  oppositePlayers: FinalizedPlayer[];
  disabled: boolean;
  handlePlayerChange: (
    player: FinalizedPlayer,
    name: TableType,
    oppPlayer: FinalizedPlayer,
    sidx: number,
    teamId?: string
  ) => void;
  handleBenchPlayer?: (player: FinalizedPlayer, teamId?: string) => void;
  teamId?: string;
  actionType: "move" | "backup";
  tableType: TableType;
}

export const PlayerActionButton: React.FC<PlayerActionButtonProps> = ({
  player,
  oppositePlayers,
  disabled,
  handlePlayerChange,
  handleBenchPlayer,
  teamId,
  actionType,
  tableType,
}) => {
  const id = useId();
  if (actionType === "move") {
    return (
      <Dropdown>
        <Dropdown.Toggle
          id={id}
          aria-label={`Move ${player.fullName || player.lineup}`}
          disabled={disabled}
        >
          Move
        </Dropdown.Toggle>
        <Dropdown.Menu>
          {oppositePlayers.map((oppPlayer, j) => (
            <Dropdown.Item
              key={j}
              onClick={() =>
                handlePlayerChange(player, tableType, oppPlayer, -1, teamId)
              }
            >
              {oppPlayer.lineup}: {oppPlayer.fullName}
            </Dropdown.Item>
          ))}
          {tableType === "starters" &&
            player.fullName !== "" &&
            handleBenchPlayer && (
              <Dropdown.Item onClick={() => handleBenchPlayer(player, teamId)}>
                bench
              </Dropdown.Item>
            )}
        </Dropdown.Menu>
      </Dropdown>
    );
  }

  return (
    <Dropdown>
      <Dropdown.Toggle
        id={id}
        aria-label={`Backup for ${player.fullName || player.lineup}: ${
          player.backup || "None"
        }`}
        disabled={disabled}
        variant="secondary"
      >
        {player.backup || "None"}
      </Dropdown.Toggle>
      <Dropdown.Menu>
        {oppositePlayers.map((oppPlayer, j) => (
          <Dropdown.Item
            key={j}
            onClick={() =>
              handlePlayerChange(player, "backup", oppPlayer, -1, teamId)
            }
          >
            {oppPlayer.fullName}
          </Dropdown.Item>
        ))}
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
      </Dropdown.Menu>
    </Dropdown>
  );
};
