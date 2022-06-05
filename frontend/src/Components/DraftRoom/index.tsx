import { useEffect } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { useParams } from "react-router-dom";
import { useSocket } from "../../Context/SocketContext";
import { PickConfirmationFooter } from "./components/PickConfirmationFooter";
import { PickTable } from "./components/PickTable";
import { PlayerSelectionBox } from "./components/PlayerSelectionBox";
import { useDraftSocket } from "./hooks/useDraftSocket";
import { useStore } from "./store";

export const DraftRoom = () => {
  const { id: roomId } = useParams() as { id: string };
  const { socket } = useSocket();
  const { draftState, player } = useStore((store) => ({
    draftState: store.state,
    player: store.player,
  }));
  console.log(draftState);
  useDraftSocket();
  useEffect(() => {
    socket?.emit("join room", roomId);
    return () => {
      if (socket) {
        socket.emit("leave room", roomId);
      }
    };
  }, [roomId, socket]);
  return (
    <Container fluid>
      <Row className="mt-3">
        <Col xl={8}>
          <PickTable />
        </Col>
        <Col xl={4}>
          <PlayerSelectionBox />
        </Col>
      </Row>
      {player && <PickConfirmationFooter />}
    </Container>
  );
};
