import { League, Position, Team, TeamWeekInfo, Week } from "@ff-mern/ff-types";
import { useMemo, useState } from "react";
import { getWeeklyLineup } from "../Components/utils/getWeeklyLineup";

const usedSuperflexLineups = (weekInfo: TeamWeekInfo[]) =>
  weekInfo.reduce((acc, info) => {
    if (info.isSuperflex) {
      return acc + 1;
    }
    return acc;
  }, 0);

export const useSuperflexData = (
  week: number,
  updateTeam: () => void,
  team?: Team,
  league?: League
) => {
  const [showSuperflexModal, setShowSuperflexModal] = useState(false);
  const numSuperflexUsed = useMemo(() => {
    if (team) {
      return usedSuperflexLineups(team.weekInfo);
    }
    return 0;
  }, [team]);
  const handleSuperflexUpdate = (
    addedPos: Position | "None",
    removedPos: Position
  ) => {
    if (league && team && addedPos !== "None") {
      let newLineup = { ...league?.lineupSettings };
      newLineup[addedPos] += 1;
      newLineup[removedPos] -= 1;
      team.weekInfo[week].isSuperflex = false; // Just generate a normal lineup with new settings first.
      team.weekInfo[week].finalizedLineup = getWeeklyLineup(
        week,
        team,
        newLineup
      );
      team.weekInfo[week].isSuperflex = true;
      updateTeam();
      setShowSuperflexModal(false);
    } else if (league && team) {
      team.weekInfo[week].isSuperflex = false;
      team.weekInfo[week].finalizedLineup = getWeeklyLineup(
        week,
        team,
        league.lineupSettings
      );
      updateTeam();
      setShowSuperflexModal(false);
    }
  };
  return {
    showSuperflexModal,
    setShowSuperflexModal,
    numSuperflexUsed,
    handleSuperflexUpdate,
  };
};
