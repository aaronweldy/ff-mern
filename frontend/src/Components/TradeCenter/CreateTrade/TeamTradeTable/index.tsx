import { RosteredPlayer, Team } from "@ff-mern/ff-types";
import { PlayerInTradeRow } from "../PlayerInTradeRow";
import "./style.css";

type TeamTradeTableProps = {
  team: Team;
  playersInTrade: Record<string, RosteredPlayer>;
  onPlayerSelection: (
    player: RosteredPlayer,
    teamId: string,
    addToTrade: boolean
  ) => void;
};

export const TeamTradeTable = ({
  team,
  playersInTrade,
  onPlayerSelection,
}: TeamTradeTableProps) => (
  <div>
    {team.rosteredPlayers
      .filter((player) => !(player.fullName in playersInTrade))
      .map((player) => (
        <PlayerInTradeRow
          key={player.fullName}
          add={true}
          player={player}
          onPlayerSelection={(name) => onPlayerSelection(name, team.id, true)}
        />
      ))}
  </div>
);
