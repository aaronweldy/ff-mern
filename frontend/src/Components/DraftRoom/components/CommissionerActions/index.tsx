import { Col, Container, Row } from "react-bootstrap";
import { useParams } from "react-router-dom";
import { useSocket } from "../../../../Context/SocketContext";
import { useStore } from "../../store";
import { CommissionerButton } from "./CommissionerButton";
import "./style.css";

export const CommissionerActions = () => {
  const { id: roomId } = useParams() as { id: string };
  const { draftState } = useStore((store) => ({ draftState: store.state }));
  const { socket } = useSocket();
  return (
    <Container className="mt-3">
      <Row className="justify-content-center">
        <Col xl={6} className="d-flex flex-column align-items-center">
          <CommissionerButton
            variant="add"
            onClick={() => socket?.emit("updateDraftPhase", "live", roomId)}
            disabled={draftState?.phase !== "predraft"}
            text="Start Draft"
          />
          <CommissionerButton
            variant="edit"
            onClick={() => socket?.emit("undoLastPick", roomId)}
            disabled={false}
            text="Undo Previous Pick"
          />
        </Col>
      </Row>
    </Container>
  );
};
