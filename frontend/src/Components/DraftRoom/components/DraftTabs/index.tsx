import { Tab, Tabs } from "react-bootstrap";
import { useParams } from "react-router-dom";
import { ChatBox } from "../ChatBox";
import { PlayerSelectionBox } from "../PlayerSelectionBox";
import { RostersByTeam } from "../RostersByTeam";

export const DraftTabs = () => {
  const { id: roomId } = useParams() as { id: string };
  return (
    <Tabs defaultActiveKey="availablePlayers">
      <Tab eventKey="availablePlayers" title="Available Players">
        <PlayerSelectionBox />
      </Tab>
      <Tab eventKey="chat" title="Chat">
        <ChatBox draftId={roomId} />
      </Tab>
      <Tab eventKey="Rosters" title="Rosters">
        <RostersByTeam />
      </Tab>
    </Tabs>
  );
};
