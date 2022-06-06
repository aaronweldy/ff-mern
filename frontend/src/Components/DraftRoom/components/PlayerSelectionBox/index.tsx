import { Position, positionTypes, ProjectedPlayer } from "@ff-mern/ff-types";
import { useMemo, useState } from "react";
import { Row, Col } from "react-bootstrap";
import { MenuSelector } from "../../../shared/MenuSelector";
import { TeamLogoBubble } from "../../../shared/TeamLogoBubble";
import { useStore } from "../../store";
import { PlayerSearchBar } from "./PlayerSearchBar";
import Fuse from "fuse.js";
import "./style.css";

export const PlayerSelectionBox = () => {
  const [selectedFilter, setSelectedFilter] = useState<Position | "all">("all");
  const [searchText, setSearchText] = useState("");

  const { draftState, selectedPlayer, setSelectedPlayer } = useStore(
    (store) => ({
      draftState: store.state,
      selectedPlayer: store.player,
      setSelectedPlayer: store.setSelectedPlayer,
    })
  );
  const availablePlayers = useMemo(() => {
    const playerSorter = (p1: ProjectedPlayer, p2: ProjectedPlayer) => {
      if (p1.average < p2.average) {
        return -1;
      }
      if (p1.average > p2.average) {
        return 1;
      }
      return 0;
    };
    if (!draftState) {
      return [];
    }
    const filteredList = draftState?.availablePlayers.filter(
      (player) =>
        selectedFilter === "all" || selectedFilter.includes(player.position)
    );
    if (!searchText) {
      return filteredList.sort(playerSorter);
    }
    const fuse = new Fuse(filteredList, {
      keys: ["team", "fullName", "position"],
    });
    return fuse.search(searchText).map((player) => player.item);
  }, [draftState, selectedFilter, searchText]);
  const onFilterChange = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    setSelectedFilter(e.currentTarget.textContent as Position);
  };
  const onTextChange = (newText: string) => {
    setSearchText(newText);
  };
  const handleSelectPlayer = (player: ProjectedPlayer) => {
    if (draftState) {
      if (player === selectedPlayer) {
        setSelectedPlayer(null);
      } else {
        setSelectedPlayer(
          draftState?.availablePlayers.find(
            (p) => p.overall === player.overall
          ) || null
        );
      }
    }
  };
  return (
    <div className="available-players">
      <Row>
        <Col className="justify-content-center title-text">
          Available Players
        </Col>
      </Row>
      <PlayerSearchBar onTextChange={onTextChange} />
      <MenuSelector
        options={["all"].concat(positionTypes)}
        selectedOption={selectedFilter}
        onChange={onFilterChange}
      />
      <div className="player-list mt-3">
        <div className="header-row">
          <div className="header-col">Name</div>
          <div className="header-col">Position Rank</div>
          <div className="header-col">Average ADP</div>
          <div className="header-col">Overall</div>
        </div>
        {availablePlayers.map((player) => (
          <div
            key={player.fullName}
            className={`selectable-player ${
              player === selectedPlayer ? "selected" : ""
            }`}
            onClick={() => handleSelectPlayer(player)}
          >
            <div className="player-row">
              <TeamLogoBubble team={player.team} />
              <span className="player-name">{player.fullName}</span>
              <span className="position-rank">{player.positionRank}</span>
              <span className="average-adp">{player.average}</span>
              <span className="overall-rank">{player.overall}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
