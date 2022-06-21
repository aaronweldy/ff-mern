import { TeamLogoBubble } from "../../../shared/TeamLogoBubble";
import { useStore } from "../../store";
import { AiOutlineCheck } from "react-icons/ai";
import { ImCancelCircle } from "react-icons/im";
import "./style.css";
import shallow from "zustand/shallow";
import { getCurrentPickInfo } from "@ff-mern/ff-types";
import { auth } from "../../../../firebase-config";
import { useAuthUser } from "@react-query-firebase/auth";
import { useSocket } from "../../../../Context/SocketContext";
import { useMemo } from "react";

type PickConfirmationFooterProps = {
  draftId: string;
};

export const PickConfirmationFooter = ({
  draftId,
}: PickConfirmationFooterProps) => {
  const { draftState, selectedPlayer, setSelectedPlayer, userIsCommissioner } =
    useStore(
      (store) => ({
        draftState: store.state,
        selectedPlayer: store.player,
        setSelectedPlayer: store.setSelectedPlayer,
        userIsCommissioner: store.userIsCommissioner,
      }),
      shallow
    );
  const { socket } = useSocket();
  const userQuery = useAuthUser("user", auth);
  const userTeamSelecting = useMemo(() => {
    if (!draftState || !userQuery.isSuccess) {
      return false;
    }
    const { round, pickInRound } = getCurrentPickInfo(draftState);
    const curPick = draftState.selections[round][pickInRound];
    return curPick.selectedBy.owner === userQuery.data?.uid;
  }, [draftState, userQuery.data, userQuery.isSuccess]);
  const handlePickConfirmation = () => {
    if (socket && draftState && selectedPlayer && userQuery.isSuccess) {
      const { round, pickInRound } = getCurrentPickInfo(draftState);
      const curPick = draftState.selections[round][pickInRound];
      const pick = {
        ...curPick,
        player: selectedPlayer,
      };
      socket.emit("draftPick", pick, draftId);
      setSelectedPlayer(null);
    }
  };

  if (!userQuery.data || !draftState) {
    return null;
  }

  return (
    <div className="footer">
      <div className="footer-row">
        {selectedPlayer && (
          <div className="mr-3 footer-bubble">
            <TeamLogoBubble team={selectedPlayer.team} />
          </div>
        )}
        <div className="player-selection-text">
          {selectedPlayer?.fullName} ({selectedPlayer?.position} -{" "}
          {selectedPlayer?.team}) Selected
        </div>
        <div className="ml-3 d-flex">
          {(userTeamSelecting || userIsCommissioner) &&
            draftState.phase === "live" && (
              <button
                className="confirm-pick-button"
                onClick={handlePickConfirmation}
              >
                <AiOutlineCheck className="mr-1" />
                {userIsCommissioner && !userTeamSelecting
                  ? "Force Pick"
                  : "Confirm"}
              </button>
            )}
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
