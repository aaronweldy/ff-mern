import { FinalizedLineup, FinalizedPlayer } from "@ff-mern/ff-types";
import { useCallback, useRef } from "react";

export const useTeamTable = (lineup: FinalizedLineup) => {
  const mutableLineup = useRef(lineup);
  const handlePlayerChange = useCallback(
    (
      selectedPlayer: FinalizedPlayer,
      name: string,
      swapPlayer: FinalizedPlayer,
      selectedIndex: number,
      manualLineup?: FinalizedLineup
    ) => {
      if (manualLineup) {
        mutableLineup.current = manualLineup;
      }
      const swapIndex = mutableLineup.current[swapPlayer.lineup].findIndex(
        (v) => v.name === swapPlayer.name
      );
      if (swapPlayer.name === "") {
        switch (name) {
          case "starters":
          case "bench":
            console.log(selectedIndex);
            console.log(swapIndex);
            selectedPlayer.lineup = swapPlayer.lineup;
            mutableLineup.current[swapPlayer.lineup].splice(
              swapIndex,
              1,
              selectedPlayer
            );
            mutableLineup.current.bench.splice(selectedIndex, 1);
            break;
          case "backup":
            break;
        }
      } else if (selectedPlayer.name === "") {
        switch (name) {
          case "starters":
          case "bench":
            swapPlayer.lineup = selectedPlayer.lineup;
            mutableLineup.current[selectedPlayer.lineup].splice(
              selectedIndex,
              1,
              swapPlayer
            );
            mutableLineup.current.bench.splice(swapIndex, 1);
            break;
          case "backup":
            break;
        }
      } else {
        switch (name) {
          case "starters":
          case "bench":
            mutableLineup.current[swapPlayer.lineup].splice(
              swapIndex,
              1,
              selectedPlayer
            );
            mutableLineup.current[selectedPlayer.lineup].splice(
              selectedIndex,
              1,
              swapPlayer
            );
            const temp = swapPlayer.lineup;
            swapPlayer.lineup = selectedPlayer.lineup;
            selectedPlayer.lineup = temp;
            break;
          case "backup":
            selectedPlayer.backup = swapPlayer.name;
            break;
        }
      }
    },
    []
  );

  const handleBenchPlayer = useCallback(
    (selectedPlayer: FinalizedPlayer, manualLineup?: FinalizedLineup) => {
      if (manualLineup) {
        mutableLineup.current = manualLineup;
      }
      mutableLineup.current.bench.push(
        new FinalizedPlayer(
          selectedPlayer.name,
          selectedPlayer.position,
          selectedPlayer.lineup
        )
      );
      selectedPlayer.name = "";
    },
    []
  );

  return { handlePlayerChange, handleBenchPlayer };
};
