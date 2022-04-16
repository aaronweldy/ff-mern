import React from "react";
import { Row, Col, Table, Image } from "react-bootstrap";
import {
  convertedScoringTypes,
  PlayerScoreData,
  Position,
  sanitizePlayerName,
  ScoringCategory,
  ScoringSetting,
  scoringTypes,
  SinglePosition,
} from "@ff-mern/ff-types";
import { Team, StoredPlayerInformation } from "@ff-mern/ff-types";
import { lineupSorter } from "../../constants";
import "../../CSS/LeaguePages.css";
import { ScoringToggleType } from "../shared/StatTypeToggleButton";
import { capitalizePlayerName } from "../utils/capitalizePlayerName";

type TeamScoringBreakdownProps = {
  leagueScoringCategories: ScoringSetting[];
  team: Team;
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
          playerData?.scoring?.categories[hashVal]?.toFixed(2)) ||
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
      <Row className="mb-3 align-items-center">
        <Col sm="auto">
          <Image
            className="image-fit-height"
            src={team.logo || process.env.REACT_APP_DEFAULT_LOGO}
          />
        </Col>
        <Col sm="auto" className="align-items-center">
          <h3>{team.name}</h3>
          <div className="subtitle">{team.ownerName}</div>
        </Col>
      </Row>
      <Row className="left-table-wrapper">
        <Table striped bordered hover className="left-scrollable-table">
          <thead>
            <tr>
              <th className="sticky-th">Lineup</th>
              <th className="sticky-th">Position</th>
              <th className="sticky-th">Player Name</th>
              <th className="sticky-th">Points</th>
              {scoringHeaders}
            </tr>
          </thead>
          <tbody>
            {Object.keys(team.weekInfo[week].finalizedLineup)
              .sort((a, b) => lineupSorter(a as Position, b as Position))
              .reduce((acc: JSX.Element[], pos) => {
                const players =
                  team.weekInfo[week].finalizedLineup[pos as Position];
                players.forEach((player, i) => {
                  const data = playerData[sanitizePlayerName(player.name)];
                  acc.push(
                    <tr
                      className={
                        pos === "bench" && i === 0 ? "top-bordered-row" : ""
                      }
                      key={player.name + pos + i.toString()}
                    >
                      <td className="gray-col">
                        <span>{player.lineup}</span>
                      </td>
                      <td className="gray-col">
                        <span>{player.position}</span>
                      </td>
                      <td className="sticky-td sticky-col gray-col">
                        {capitalizePlayerName(player.name)}
                      </td>
                      <td>
                        <span>
                          {data?.scoring?.totalPoints?.toFixed(2) || 0}
                        </span>
                      </td>
                      {dataDisplay === "scoring"
                        ? getScoringData(
                            player.position,
                            data,
                            leagueScoringCategories
                          )
                        : getStatsData(player.position, data)}
                    </tr>
                  );
                });
                return acc;
              }, [])}
          </tbody>
        </Table>
      </Row>
      <Row>
        <Table striped bordered className="w-auto">
          <tbody>
            <tr>
              <td colSpan={3}>
                <b>Point Adjustment</b>
              </td>
              <td>{team.weekInfo[week].addedPoints}</td>
            </tr>
            <tr>
              <td colSpan={3}>
                <b>Total points:</b>
              </td>
              <td>{Team.sumWeekScore(team, week).toFixed(2)}</td>
            </tr>
          </tbody>
        </Table>
      </Row>
    </>
  );
};

export default TeamScoringBreakdown;
