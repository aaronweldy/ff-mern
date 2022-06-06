import { TeamLogoBubble } from "../../../shared/TeamLogoBubble";
import { useStore } from "../../store";
import { AiOutlineCheck } from "react-icons/ai";
import { ImCancelCircle } from "react-icons/im";
import "./style.css";
import shallow from "zustand/shallow";
import { getCurrentPickInfo } from "@ff-mern/ff-types";
import { auth } from "../../../../firebase-config";
import { useTeams } from "../../../../hooks/query/useTeams";
import { useAuthUser } from "@react-query-firebase/auth";
import { useSocket } from "../../../../Context/SocketContext";

type PickConfirmationFooterProps = {
  draftId: string;
};

export const PickConfirmationFooter = ({
  draftId,
}: PickConfirmationFooterProps) => {
  const { draftState, selectedPlayer, setSelectedPlayer } = useStore(
    (store) => ({
      draftState: store.state,
      selectedPlayer: store.player,
      setSelectedPlayer: store.setSelectedPlayer,
    }),
    shallow
  );
  const { socket } = useSocket();
  const userQuery = useAuthUser("user", auth);
  const { query: teamsQuery } = useTeams(draftState?.leagueId || "");

  const handlePickConfirmation = () => {
    if (
      socket &&
      draftState &&
      selectedPlayer &&
      userQuery.isSuccess &&
      teamsQuery.isSuccess
    ) {
      const { round, pickInRound } = getCurrentPickInfo(draftState);
      const curPick = draftState.selections[round][pickInRound];
      const selectingTeam = teamsQuery.data.teams.find(
        (team) => team.id === curPick.selectedBy
      );
      //if (selectingTeam?.owner === userQuery.data?.uid) {
      const pick = {
        ...curPick,
        player: selectedPlayer,
      };
      socket.emit("draftPick", pick, draftId);
      setSelectedPlayer(null);
      //}
    }
  };

  return (
    <div className="footer">
      <div className="footer-row">
        {selectedPlayer && (
          <div className="mr-3">
            <TeamLogoBubble team={selectedPlayer.team} />
          </div>
        )}
        <div className="player-selection-text">
          {selectedPlayer?.fullName} ({selectedPlayer?.position} -{" "}
          {selectedPlayer?.team}) Selected
        </div>
        <div className="ml-3 d-flex">
          <button
            className="confirm-pick-button"
            onClick={handlePickConfirmation}
          >
            <AiOutlineCheck className="mr-1" />
            Confirm
          </button>
          <button
            className="cancel-pick-button"
            onClick={() => setSelectedPlayer(null)}
          >
            <ImCancelCircle className="mr-1" />
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
