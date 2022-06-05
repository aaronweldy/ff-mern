import { TeamLogoBubble } from "../../../shared/TeamLogoBubble";
import { useStore } from "../../store";
import { AiOutlineCheck } from "react-icons/ai";
import { ImCancelCircle } from "react-icons/im";
import "./style.css";

export const PickConfirmationFooter = () => {
  const { selectedPlayer, setSelectedPlayer } = useStore((store) => ({
    selectedPlayer: store.player,
    setSelectedPlayer: store.setSelectedPlayer,
  }));

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
          <button className="confirm-pick-button">
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
