import { Tab, Tabs } from "react-bootstrap";
import { useParams } from "react-router-dom";
import { useStore } from "../../store";
import { ChatBox } from "../ChatBox";
import { CommissionerActions } from "../CommissionerActions";
import { PlayerSelectionBox } from "../PlayerSelectionBox";
import { RostersByTeam } from "../RostersByTeam";

export const DraftTabs = () => {
  const { id: roomId } = useParams() as { id: string };
  const isCommissioner = useStore((store) => store.userIsCommissioner);
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
      {isCommissioner && (
        <Tab eventKey="actions" title="Commissioner">
          <CommissionerActions />
        </Tab>
      )}
    </Tabs>
  );
};
