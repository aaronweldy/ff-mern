import { RosteredPlayer } from "@ff-mern/ff-types";
import { Row, Col } from "react-bootstrap";
import { InlineTeamTile } from "../../../shared/InlineTeamTile";

type PlayerInTradeRowProps = {
  player: RosteredPlayer;
  add: boolean;
  onPlayerSelection: (player: RosteredPlayer, addToTrade: boolean) => void;
};

export const PlayerInTradeRow = ({
  player,
  add,
  onPlayerSelection,
}: PlayerInTradeRowProps) => (
  <Row key={player.fullName} className="d-flex align-items-center my-3">
    <Col className="flex-grow-0">
      <button
        className={`button ${add ? "button--add" : "button--remove"}`}
        onClick={() => onPlayerSelection(player, true)}
      >
        <div className="mb-1">
          <b>{add ? "+" : "-"}</b>
        </div>
      </button>
    </Col>
    <Col xl={4}>{player.fullName}</Col>
    <Col xl={1}>{player.position}</Col>
    <Col className="d-flex align-items-center">
      <InlineTeamTile team={player.team} />
    </Col>
  </Row>
);
