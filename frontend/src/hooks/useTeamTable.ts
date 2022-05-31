import { FinalizedLineup, FinalizedPlayer } from "@ff-mern/ff-types";
import { useCallback } from "react";

export const useTeamTable = () => {
  const handlePlayerChange = useCallback(
    (
      selectedPlayer: FinalizedPlayer,
      name: string,
      swapPlayer: FinalizedPlayer,
      selectedIndex: number,
      lineup: FinalizedLineup
    ) => {
      console.log(lineup);
      const swapIndex = lineup[swapPlayer.lineup].findIndex(
        (v) => v.fullName === swapPlayer.fullName
      );
      if (swapPlayer.fullName === "") {
        switch (name) {
          case "starters":
          case "bench":
            selectedPlayer.lineup = swapPlayer.lineup;
            lineup[swapPlayer.lineup].splice(swapIndex, 1, selectedPlayer);
            lineup.bench.splice(selectedIndex, 1);
            break;
          case "backup":
            break;
        }
      } else if (selectedPlayer.fullName === "") {
        switch (name) {
          case "starters":
          case "bench":
            swapPlayer.lineup = selectedPlayer.lineup;
            lineup[selectedPlayer.lineup].splice(selectedIndex, 1, swapPlayer);
            lineup.bench.splice(swapIndex, 1);
            break;
          case "backup":
            break;
        }
      } else {
        switch (name) {
          case "starters":
          case "bench":
            lineup[swapPlayer.lineup].splice(swapIndex, 1, selectedPlayer);
            lineup[selectedPlayer.lineup].splice(selectedIndex, 1, swapPlayer);
            const temp = swapPlayer.lineup;
            swapPlayer.lineup = selectedPlayer.lineup;
            selectedPlayer.lineup = temp;
            break;
          case "backup":
            selectedPlayer.backup = swapPlayer.fullName;
            break;
        }
      }
    },
    []
  );

  const handleBenchPlayer = useCallback(
    (selectedPlayer: FinalizedPlayer, lineup: FinalizedLineup) => {
      lineup.bench.push(
        new FinalizedPlayer(
          selectedPlayer.fullName,
          selectedPlayer.position,
          selectedPlayer.team,
          "bench"
        )
      );
      selectedPlayer.fullName = "";
      selectedPlayer.team = "None";
    },
    []
  );

  return { handlePlayerChange, handleBenchPlayer };
};
