import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  AbbreviationToFullTeam,
  AbbreviatedNflTeam,
  CumulativePlayerScores,
  getCurrentSeason,
  positionTypes,
  sanitizePlayerName,
  SinglePosition,
} from "@ff-mern/ff-types";
import { useAuthUser } from "@react-query-firebase/auth";
import LeagueButton from "../shared/LeagueButton";
import { CumulativePlayerTable } from "./CumulativePlayerTable";
import { Col, Container, Form, Row, Spinner } from "react-bootstrap";
import { MenuSelector } from "../shared/MenuSelector";
import { useCumulativePlayerScores } from "../../hooks/query/useCumulativePlayerScores";
import { useCumulativePlayerScoreYears } from "../../hooks/query/useCumulativePlayerScoreYears";
import { useTeams } from "../../hooks/query/useTeams";
import { auth } from "../../firebase-config";

export type PositionFilter = SinglePosition | "all";
export type TeamFilter = AbbreviatedNflTeam | "all";

export const CumulativePlayers = () => {
  const { id } = useParams() as { id: string };
  const userQuery = useAuthUser("user", auth);
  const { teams } = useTeams(id);
  const currentSeason = getCurrentSeason();
  const scoreYearsQuery = useCumulativePlayerScoreYears(id);
  const [selectedYear, setSelectedYear] = useState<number>(currentSeason);
  const [selectedFilter, setFilter] = useState<PositionFilter>("all");
  const [selectedTeam, setSelectedTeam] = useState<TeamFilter>("all");
  const scoreYears = scoreYearsQuery.data?.years || [currentSeason];
  const cumulativeScoresQuery = useCumulativePlayerScores(id, selectedYear);
  const userTeam = teams.find((team) => team.owner === userQuery.data?.uid);

  const userTeamPlayerNames = useMemo(
    () =>
      new Set(
        (userTeam?.rosteredPlayers || []).map((player) =>
          sanitizePlayerName(player.sanitizedName || player.fullName)
        )
      ),
    [userTeam]
  );

  const availableTeams = useMemo(() => {
    const playerScores = cumulativeScoresQuery.data || {};
    return Array.from(
      new Set(Object.values(playerScores).map((playerScore) => playerScore.team))
    ).sort((a, b) =>
      AbbreviationToFullTeam[a].localeCompare(AbbreviationToFullTeam[b])
    );
  }, [cumulativeScoresQuery.data]);

  useEffect(() => {
    if (scoreYears.length > 0 && !scoreYears.includes(selectedYear)) {
      setSelectedYear(scoreYears[0]);
    }
  }, [scoreYears, selectedYear]);

  useEffect(() => {
    if (
      cumulativeScoresQuery.isSuccess &&
      selectedTeam !== "all" &&
      !availableTeams.includes(selectedTeam)
    ) {
      setSelectedTeam("all");
    }
  }, [availableTeams, cumulativeScoresQuery.isSuccess, selectedTeam]);

  const onChange = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    setFilter(e.currentTarget.textContent as PositionFilter);
  };

  const playersToRender = useMemo(() => {
    const playerScores = cumulativeScoresQuery.data || {};
    return Object.keys(playerScores).reduce(
      (acc: CumulativePlayerScores, playerName: string) => {
        const playerScore = playerScores[playerName];
        const matchesPosition =
          selectedFilter === "all" ||
          selectedFilter.includes(playerScore.position);
        const matchesTeam =
          selectedTeam === "all" || playerScore.team === selectedTeam;

        if (matchesPosition && matchesTeam) {
          acc[playerName] = playerScore;
        }
        return acc;
      },
      {}
    );
  }, [selectedFilter, selectedTeam, cumulativeScoresQuery.data]);
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
        <Col xs="auto" className="d-flex align-items-center">
          <Form.Label htmlFor="cumulative-score-team" className="mb-0">
            NFL Team
          </Form.Label>
          <Form.Control
            as="select"
            id="cumulative-score-team"
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value as TeamFilter)}
            disabled={cumulativeScoresQuery.isLoading}
            className="ml-2"
            style={{ width: "auto" }}
          >
            <option value="all">All teams</option>
            {availableTeams.map((team) => (
              <option key={team} value={team}>
                {AbbreviationToFullTeam[team].replace(/\b\w/g, (letter) =>
                  letter.toUpperCase()
                )} ({team})
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
      <small className="cumulative-player-legend">
        Players on your roster are highlighted.
      </small>
      {cumulativeScoresQuery.isLoading && (
        <Row className="justify-content-center mt-4">
          <Col xs="auto" className="d-flex align-items-center">
            <Spinner animation="border" role="status" size="sm" />
            <span className="ml-2">Loading player scoring...</span>
          </Col>
        </Row>
      )}
      {cumulativeScoresQuery.isSuccess && !cumulativeScoresQuery.isLoading && (
        <CumulativePlayerTable
          players={playersToRender}
          userTeamPlayerNames={userTeamPlayerNames}
        />
      )}
    </Container>
  );
};
