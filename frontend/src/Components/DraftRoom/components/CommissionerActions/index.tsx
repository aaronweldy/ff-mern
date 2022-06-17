import { Button, Col, Container, Row } from "react-bootstrap";
import { useParams } from "react-router-dom";
import { useSocket } from "../../../../Context/SocketContext";
import { useStore } from "../../store";
import "./style.css";

export const CommissionerActions = () => {
  const { id: roomId } = useParams() as { id: string };
  const { draftState } = useStore((store) => ({ draftState: store.state }));
  const { socket } = useSocket();
  return (
    <Container className="mt-3">
      <Row className="justify-content-center">
        <Col xl={6} className="d-flex flex-column align-items-center">
          {draftState?.phase === "predraft" && (
            <Button
              variant="success"
              onClick={() => socket?.emit("updateDraftPhase", "live", roomId)}
              className="w-100"
            >
              Start Draft
            </Button>
          )}
          {draftState?.phase === "live" && (
            <>
              <Button
                variant="warning"
                onClick={() => socket?.emit("undoLastPick", roomId)}
                className="w-100"
              >
                Undo Previous Pick
              </Button>
              <Button
                variant="info"
                onClick={() => socket?.emit("autoPick", roomId)}
                className="w-100 mt-3"
              >
                Autoselect
              </Button>
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
};
