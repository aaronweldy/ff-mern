import { RosteredPlayer, Team } from "@ff-mern/ff-types";
import { Col, Row } from "react-bootstrap";
import { PlayerInTradeRow } from "../PlayerInTradeRow";

type ActiveTradeViewProps = {
  team: Team;
  currentTrade: Record<string, RosteredPlayer>;
  onPlayerSelection: (
    player: RosteredPlayer,
    teamId: string,
    addToTrade: boolean
  ) => void;
};

export const ActiveTradeView = ({
  team,
  currentTrade,
  onPlayerSelection,
}: ActiveTradeViewProps) => (
  <>
    <Row>
      <Col>
        <h5>{team.name}</h5>
      </Col>
    </Row>
    <Row>
      <Col>
        <h6>Players in Trade</h6>
        {Object.values(currentTrade).map((player) => (
          <PlayerInTradeRow
            key={player.fullName}
            add={false}
            player={player}
            onPlayerSelection={(name) =>
              onPlayerSelection(name, team.id, false)
            }
          />
        ))}
      </Col>
    </Row>
  </>
);
