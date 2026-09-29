import {
  Team,
  Position,
  PlayerScoreData,
  ScoringSetting,
  SinglePosition,
  StoredPlayerInformation,
  lineupSorter,
} from "@ff-mern/ff-types";
import { Table } from "react-bootstrap";
import { InlineTeamTile } from "../../../shared/InlineTeamTile";
import { ScoringToggleType } from "../../../shared/StatTypeToggleButton";
import styles from "./TableStyles.module.css";

type ScoreBreakdownTableProps = {
  team: Team;
  week: number;
  scoringHeaders: JSX.Element[];
  playerData: PlayerScoreData;
  leagueScoringCategories: ScoringSetting[];
  dataDisplay: ScoringToggleType;
  getScoringData: (
    position: SinglePosition,
    playerData: StoredPlayerInformation,
    categories: ScoringSetting[]
  ) => JSX.Element[];
  getStatsData: (
    position: SinglePosition,
    playerData: StoredPlayerInformation
  ) => JSX.Element[];
};

export const ScoreBreakdownTable = ({
  team,
  week,
  scoringHeaders,
  playerData,
  dataDisplay,
  leagueScoringCategories,
  getScoringData,
  getStatsData,
}: ScoreBreakdownTableProps) => (
  <Table
    striped
    bordered
    hover
    className="left-scrollable-table score-breakdown-table"
  >
    <thead>
      <tr>
        <th scope="col" className="sticky-th score-player">
          Player Name
        </th>
        <th scope="col" className="sticky-th">
          Points
        </th>
        <th scope="col" className="sticky-th">
          Lineup
        </th>
        <th scope="col" className="sticky-th">
          Position
        </th>
        <th scope="col" className="sticky-th">
          Team
        </th>
        {scoringHeaders}
      </tr>
    </thead>
    <tbody>
      {Object.keys(
        team.weekInfo[week].scoringLineup ?? team.weekInfo[week].finalizedLineup
      )
        .sort((a, b) => lineupSorter(a as Position, b as Position))
        .reduce((acc: JSX.Element[], pos) => {
          const players = (team.weekInfo[week].scoringLineup ??
            team.weekInfo[week].finalizedLineup)[pos as Position];
          players.forEach((player, i) => {
            const data = playerData[player.sanitizedName];
            acc.push(
              <tr
                className={
                  pos === "bench" && i === 0 ? styles["top-bordered-row"] : ""
                }
                key={player.fullName + pos + i.toString()}
              >
                <th scope="row" className="score-player">
                  {player.fullName}
                </th>
                <td>{data?.scoring?.totalPoints?.toFixed(2) || "0.00"}</td>
                <td className={`${styles["gray-col"]}`}>
                  <span>{player.lineup}</span>
                </td>
                <td className={`${styles["gray-col"]}`}>
                  <span>{player.position}</span>
                </td>
                <td className={`${styles["gray-col"]}`}>
                  <InlineTeamTile team={player.team} />
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
);
