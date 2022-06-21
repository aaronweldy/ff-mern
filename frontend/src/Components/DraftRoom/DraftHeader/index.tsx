import { getCurrentPickInfo } from "@ff-mern/ff-types";
import { useMemo } from "react";
import { useStore } from "../store";
import "./style.css";

export const DraftHeader = () => {
  const draftState = useStore((store) => store.state);
  const pickInfo = useMemo(() => {
    console.log(draftState);
    if (!draftState || draftState.phase !== "live") {
      return null;
    }
    const curPick = getCurrentPickInfo(draftState);
    return {
      curPick,
      selectingTeam: draftState.selections[curPick.round][curPick.pickInRound],
    };
  }, [draftState]);
  if (!pickInfo || draftState?.phase !== "live") {
    return (
      <div className="draft-header">
        <div className="draft-header-title">
          <span className="draft-pick-title">
            {draftState?.phase.toLocaleUpperCase()}
          </span>
        </div>
      </div>
    );
  }
  return (
    <div className="draft-header">
      <span className="draft-pick-title">Current Pick:</span>
      <div className="draft-pick-col">
        <div className="pick-row w-100">
          <b>Round:</b> <span>{pickInfo?.curPick.round + 1}</span>
        </div>
        <div className="pick-row w-100">
          <b>Pick:</b>
          <span>{pickInfo?.curPick.pickInRound + 1}</span>
        </div>
        <div className="pick-row w-100">
          <b>Selecting:</b>
          <span>{pickInfo?.selectingTeam.selectedBy.name}</span>
        </div>
      </div>
    </div>
  );
};
