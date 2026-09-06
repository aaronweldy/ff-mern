import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  CumulativePlayerScores,
  getCurrentSeason,
  positionTypes,
  SinglePosition,
} from "@ff-mern/ff-types";
import LeagueButton from "../shared/LeagueButton";
import { CumulativePlayerTable } from "./CumulativePlayerTable";
import { Col, Container, Form, Row, Spinner } from "react-bootstrap";
import { MenuSelector } from "../shared/MenuSelector";
import { useCumulativePlayerScores } from "../../hooks/query/useCumulativePlayerScores";
import { useCumulativePlayerScoreYears } from "../../hooks/query/useCumulativePlayerScoreYears";

export type PositionFilter = SinglePosition | "all";

export const CumulativePlayers = () => {
  const { id } = useParams() as { id: string };
  const currentSeason = getCurrentSeason();
  const scoreYearsQuery = useCumulativePlayerScoreYears(id);
  const [selectedYear, setSelectedYear] = useState<number>(currentSeason);
  const [selectedFilter, setFilter] = useState<PositionFilter>("all");
  const scoreYears = scoreYearsQuery.data?.years || [currentSeason];
  const cumulativeScoresQuery = useCumulativePlayerScores(id, selectedYear);

  useEffect(() => {
    if (scoreYears.length > 0 && !scoreYears.includes(selectedYear)) {
      setSelectedYear(scoreYears[0]);
    }
  }, [scoreYears, selectedYear]);

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
  }, [selectedFilter, cumulativeScoresQuery.data]);
  return (
    <Container fluid>
      <Row className="mt-3 align-items-center justify-content-between">
        <Col>
          <LeagueButton id={id} />
        </Col>
        <Col xs="auto" className="d-flex align-items-center">
          <Form.Label htmlFor="cumulative-score-year" className="mb-0">
            Season
          </Form.Label>
          <Form.Control
            as="select"
            id="cumulative-score-year"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            disabled={scoreYearsQuery.isLoading}
            className="ml-2"
            style={{ width: "auto" }}
          >
            {scoreYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </Form.Control>
        </Col>
      </Row>
      <MenuSelector
        options={["all"].concat(positionTypes)}
        selectedOption={selectedFilter}
        onChange={onChange}
      />
      {cumulativeScoresQuery.isLoading && (
        <Row className="justify-content-center mt-4">
          <Col xs="auto" className="d-flex align-items-center">
            <Spinner animation="border" role="status" size="sm" />
            <span className="ml-2">Loading player scoring...</span>
          </Col>
        </Row>
      )}
      {cumulativeScoresQuery.isSuccess && !cumulativeScoresQuery.isLoading && (
        <CumulativePlayerTable players={playersToRender} />
      )}
    </Container>
  );
};
