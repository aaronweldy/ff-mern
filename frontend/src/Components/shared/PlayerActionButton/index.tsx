import React from 'react';
import { SplitButton, Dropdown, DropdownButton } from 'react-bootstrap';
import { FinalizedPlayer, AbbreviatedNflTeam } from "@ff-mern/ff-types";

type TableType = "starters" | "bench" | "backup";

interface PlayerActionButtonProps {
    player: FinalizedPlayer;
    oppositePlayers: FinalizedPlayer[];
    disabled: boolean;
    selectedIndex: number;
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
    selectedIndex,
    handlePlayerChange,
    handleBenchPlayer,
    teamId,
    actionType,
    tableType,
}) => {
    if (actionType === "move") {
        return (
            <DropdownButton title="Move" disabled={disabled}>
                {oppositePlayers.map((oppPlayer, j) => (
                    <Dropdown.Item
                        key={j}
                        onClick={() =>
                            handlePlayerChange(player, tableType, oppPlayer, selectedIndex, teamId)
                        }
                    >
                        {oppPlayer.lineup}: {oppPlayer.fullName}
                    </Dropdown.Item>
                ))}
                {tableType === "starters" && player.fullName !== "" && handleBenchPlayer && (
                    <Dropdown.Item
                        onClick={() => handleBenchPlayer(player, teamId)}
                    >
                        bench
                    </Dropdown.Item>
                )}
            </DropdownButton>
        );
    }

    return (
        <SplitButton
            id={`backup-${player.fullName}`}
            title={!player.backup ? "None" : player.backup}
            disabled={disabled}
            variant="secondary"
        >
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
                        new FinalizedPlayer("", player.position, "" as AbbreviatedNflTeam, "bench"),
                        -1,
                        teamId
                    )
                }
            >
                None
            </Dropdown.Item>
        </SplitButton>
    );
};