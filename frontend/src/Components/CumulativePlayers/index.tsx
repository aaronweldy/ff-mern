import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { CumulativePlayerScores } from "@ff-mern/ff-types";
import LeagueButton from "../shared/LeagueButton";
import { CumulativePlayerTable } from "./CumulativePlayerTable";
import { Col, Container, Row } from "react-bootstrap";
import { PositionFilter, PositionToggle } from "../shared/PositionToggle";
import { useCumulativePlayerScores } from "../../hooks/query/useCumulativePlayerScores";

export const CumulativePlayers = () => {
  const { id } = useParams() as { id: string };
  const cumulativeScoresQuery = useCumulativePlayerScores(id);
  const [selectedFilter, setFilter] = useState<PositionFilter>("all");

  const onChange = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    setFilter(e.currentTarget.textContent as PositionFilter);
  };

  const playersToRender = useMemo(() => {
    if (cumulativeScoresQuery.isSuccess && selectedFilter !== "all") {
      return Object.keys(cumulativeScoresQuery.data)
        .filter(
          (playerName) =>
            selectedFilter.indexOf(
              cumulativeScoresQuery.data[playerName].position
            ) >= 0
        )
        .reduce((acc: CumulativePlayerScores, playerName: string) => {
          acc[playerName] = cumulativeScoresQuery.data[playerName];
          return acc;
        }, {});
    }
    return cumulativeScoresQuery.data || {};
  }, [selectedFilter, cumulativeScoresQuery]);
  return (
    <Container fluid>
      <Row className="mt-3">
        <Col>
          <LeagueButton id={id} />
        </Col>
      </Row>
      <PositionToggle selectedFilter={selectedFilter} onChange={onChange} />
      {cumulativeScoresQuery.isSuccess && (
        <CumulativePlayerTable players={playersToRender} />
      )}
    </Container>
  );
};
