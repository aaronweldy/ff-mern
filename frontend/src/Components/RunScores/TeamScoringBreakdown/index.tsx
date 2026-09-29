import React from "react";
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
          <th scope="col" className="sticky-th" key={i}>
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
        <th scope="col" className="sticky-th" key={i}>
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
      <TeamHeader name={team.name} owner={team.ownerName} logo={team.logo} />
      <TeamFooter team={team} week={week} />
      <div className="score-results">
        <section aria-labelledby="player-breakdown-heading">
          <h2 className="h4" id="player-breakdown-heading">
            Player breakdown
          </h2>
          <div
            className="data-table-scroll score-table-scroll"
            role="region"
            aria-label="Player scoring breakdown"
            tabIndex={0}
          >
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
          </div>
        </section>
        <section
          className="weekly-standings"
          aria-labelledby="weekly-standings-heading"
        >
          <h2 className="h4" id="weekly-standings-heading">
            Week {week} standings
          </h2>
          <ScorePlacementTable teams={allTeams} week={week || 1} />
        </section>
      </div>
    </>
  );
};

export default TeamScoringBreakdown;
