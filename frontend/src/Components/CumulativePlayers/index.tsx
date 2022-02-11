import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { CumulativePlayerScores } from "@ff-mern/ff-types";
import { API } from "../../API";
import LeagueButton from "../shared/LeagueButton";
import { CumulativePlayerTable } from "./CumulativePlayerTable";
import { Container } from "react-bootstrap";
import { PositionFilter, PositionToggle } from "./PositionToggle";

export const CumulativePlayers = () => {
  const { id } = useParams<{ id: string }>();
  const [playerData, setPlayerData] = useState<CumulativePlayerScores>();
  const [selectedFilter, setFilter] = useState<PositionFilter>("all");

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value as PositionFilter);
  };

  useEffect(() => {
    API.fetchCumulativePlayerScores(id).then((data) => setPlayerData(data));
  }, [id]);

  const playersToRender = useMemo(() => {
    if (playerData && selectedFilter !== "all") {
      return Object.keys(playerData)
        .filter(
          (playerName) =>
            selectedFilter.indexOf(playerData[playerName].position) >= 0
        )
        .reduce((acc: CumulativePlayerScores, playerName: string) => {
          acc[playerName] = playerData[playerName];
          return acc;
        }, {});
    }
    return playerData;
  }, [selectedFilter, playerData]);
  return (
    <Container fluid>
      <LeagueButton id={id} />
      <PositionToggle selectedFilter={selectedFilter} onChange={onChange} />
      {playersToRender && <CumulativePlayerTable players={playersToRender} />}
    </Container>
  );
};
