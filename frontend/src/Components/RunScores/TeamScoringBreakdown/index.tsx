import React from "react";
import { Row, Col } from "react-bootstrap";
import {
  convertedScoringTypes,
  PlayerScoreData,
  ScoringCategory,
  ScoringSetting,
  scoringTypes,
  SinglePosition,
} from "@ff-mern/ff-types";
import { Team, StoredPlayerInformation } from "@ff-mern/ff-types";
import "../../../CSS/LeaguePages.css";
import { ScoringToggleType } from "../../shared/StatTypeToggleButton";
import { TeamHeader } from "./TeamHeader";
import { TeamFooter } from "./TeamFooter";
import { ScoreBreakdownTable } from "./ScoreBreakdownTable";
import ScorePlacementTable from "./ScorePlacementTable";

type TeamScoringBreakdownProps = {
  leagueScoringCategories: ScoringSetting[];
  team: Team;
  allTeams: Team[];
  week: number;
  playerData: PlayerScoreData;
  dataDisplay: "statistics" | "scoring";
};

const getCategoryHeaders = (
  type: ScoringToggleType,
  leagueCategories: ScoringSetting[]
) => {
  switch (type) {
    case "scoring":
      return leagueCategories.map((stat, i) => {
        const cat = stat.category;
        return (
          <th className="sticky-th" key={i}>
            {cat.qualifier}{" "}
            {cat.qualifier === "between"
              ? `${cat.thresholdMin}/${cat.thresholdMax}`
              : cat.threshold}{" "}
            {cat.statType}
          </th>
        );
      });
    case "statistics":
      return scoringTypes.map((type, i) => (
        <th className="sticky-th" key={i}>
          {type}
        </th>
      ));
  }
};

const getScoringData = (
  position: SinglePosition,
  playerData: StoredPlayerInformation,
  categories: ScoringSetting[]
) => {
  return categories.map((stat, idx) => {
    const cat = stat.category;
    const hashVal =
      cat.qualifier === "between"
        ? `${cat.qualifier}|${cat.thresholdMin}${cat.thresholdMax}|${cat.statType}`
        : `${cat.qualifier}|${cat.threshold}|${cat.statType}`;
    return (
      <td key={idx}>
        {(stat.position.indexOf(position) >= 0 &&
          (playerData?.scoring?.categories[hashVal] === 0
            ? 0
            : playerData?.scoring?.categories[hashVal]?.toFixed(2))) ||
          0}
      </td>
    );
  });
};

const getStatsData = (
  position: SinglePosition,
  playerData: StoredPlayerInformation
) => {
  return scoringTypes.map((category, i) => {
    const categoriesForPosition = convertedScoringTypes[position];
    return (
      <td key={i}>
        {category in categoriesForPosition && playerData
          ? playerData.statistics[
          categoriesForPosition[category as ScoringCategory]!
          ]
          : 0}
      </td>
    );
  });
};

const TeamScoringBreakdown = ({
  leagueScoringCategories,
  team,
  allTeams,
  week,
  playerData,
  dataDisplay,
}: TeamScoringBreakdownProps) => {
  const scoringHeaders = getCategoryHeaders(
    dataDisplay,
    leagueScoringCategories
  );
  return (
    <>
      <Row>
        <Col>
          <TeamHeader
            name={team.name}
            owner={team.ownerName}
            logo={team.logo}
          />
        </Col>
      </Row>
      <Row>
        <Col md={9} className="left-table-wrapper">
          <ScoreBreakdownTable
            team={team}
            week={week}
            scoringHeaders={scoringHeaders}
            playerData={playerData}
            dataDisplay={dataDisplay}
            leagueScoringCategories={leagueScoringCategories}
            getScoringData={getScoringData}
            getStatsData={getStatsData}
          />
        </Col>
        <Col>
          <ScorePlacementTable teams={allTeams} week={week || 1} />
        </Col>
      </Row>
      <Row>
        <Col>
          <TeamFooter team={team} week={week} />
        </Col>
      </Row>
    </>
  );
};

export default TeamScoringBreakdown;
