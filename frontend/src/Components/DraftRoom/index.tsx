import { useEffect } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { useParams } from "react-router-dom";
import { useSocket } from "../../Context/SocketContext";
import { PickConfirmationFooter } from "./components/PickConfirmationFooter";
import { PickTable } from "./components/PickTable";
import { DraftTabs } from "./components/DraftTabs";
import { useDraftSocket } from "./hooks/useDraftSocket";
import { useStore } from "./store";
import { DraftHeader } from "./DraftHeader";

export const DraftRoom = () => {
  const { id: roomId } = useParams() as { id: string };
  const { socket } = useSocket();
  const { player } = useStore((store) => ({
    draftState: store.state,
    player: store.player,
  }));
  useDraftSocket();
  useEffect(() => {
    socket?.on("connect", () => {
      socket.emit("join room", roomId);
    });
    socket?.on("disconnect", (reason) => {
      if (reason === "io server disconnect") {
        socket?.connect();
      }
    });
    return () => {
      if (socket) {
        socket.emit("leave room", roomId);
        socket.off("disconnect");
        socket.off("connect");
      }
    };
  }, [roomId, socket]);
  return (
    <Container fluid>
      <DraftHeader />
      <Row className="mt-3">
        <Col xl={8}>
          <PickTable />
        </Col>
        <Col xl={4}>
          <DraftTabs />
        </Col>
      </Row>
      {player && <PickConfirmationFooter draftId={roomId} />}
    </Container>
  );
};
