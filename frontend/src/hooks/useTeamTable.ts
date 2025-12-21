import { FinalizedLineup, FinalizedPlayer } from "@ff-mern/ff-types";
import { useCallback } from "react";

export const useTeamTable = () => {
  const canPlayerFitLineup = useCallback((player: FinalizedPlayer, lineup: string) => {
    if (lineup === "bench") {
      return true;
    }
    return lineup.split("/").includes(player.position);
  }, []);

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

  const handleDragSwap = useCallback(
    ({
      fromLineup,
      fromIndex,
      toLineup,
      toIndex,
      lineup,
    }: {
      fromLineup: string;
      fromIndex: number;
      toLineup: string;
      toIndex: number;
      lineup: FinalizedLineup;
    }) => {
      if (fromLineup === toLineup && fromIndex === toIndex) {
        return false;
      }

      const fromArr = lineup[fromLineup as keyof FinalizedLineup] as FinalizedPlayer[] | undefined;
      const toArr = lineup[toLineup as keyof FinalizedLineup] as FinalizedPlayer[] | undefined;
      if (!fromArr || !toArr) {
        return false;
      }

      const fromPlayer = fromArr[fromIndex];
      const toPlayer = toArr[toIndex];
      if (!fromPlayer || fromPlayer.fullName === "" || !toPlayer) {
        return false;
      }

      const canFitTarget = canPlayerFitLineup(fromPlayer, toLineup);
      const canFitSource =
        toPlayer.fullName === "" ? true : canPlayerFitLineup(toPlayer, fromLineup);
      if (!canFitTarget || !canFitSource) {
        return false;
      }

      if (fromLineup === "bench" && toLineup !== "bench" && toPlayer.fullName === "") {
        fromArr.splice(fromIndex, 1);
        fromPlayer.lineup = toLineup;
        toArr.splice(toIndex, 1, fromPlayer);
        return true;
      }

      if (fromLineup !== "bench" && toLineup !== "bench" && toPlayer.fullName === "") {
        fromArr.splice(fromIndex, 1, toPlayer);
        toArr.splice(toIndex, 1, fromPlayer);
        fromPlayer.lineup = toLineup;
        toPlayer.lineup = fromLineup;
        return true;
      }

      fromArr.splice(fromIndex, 1, toPlayer);
      toArr.splice(toIndex, 1, fromPlayer);
      fromPlayer.lineup = toLineup;
      toPlayer.lineup = fromLineup;
      return true;
    },
    [canPlayerFitLineup]
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
      selectedPlayer.sanitizedName = "";
      selectedPlayer.team = "None";
    },
    []
  );

  return { handlePlayerChange, handleBenchPlayer, handleDragSwap };
};
