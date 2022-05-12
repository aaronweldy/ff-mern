import {
  Team,
  Position,
  PlayerScoreData,
  ScoringSetting,
  SinglePosition,
  StoredPlayerInformation,
} from "@ff-mern/ff-types";
import { Table } from "react-bootstrap";
import { lineupSorter } from "../../../../constants";
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
  <Table striped bordered hover className="left-scrollable-table">
    <thead>
      <tr>
        <th className="sticky-th">Lineup</th>
        <th className="sticky-th">Position</th>
        <th className="sticky-th">Player Name</th>
        <th className="sticky-th">Team</th>
        <th className="sticky-th">Points</th>
        {scoringHeaders}
      </tr>
    </thead>
    <tbody>
      {Object.keys(team.weekInfo[week].finalizedLineup)
        .sort((a, b) => lineupSorter(a as Position, b as Position))
        .reduce((acc: JSX.Element[], pos) => {
          const players = team.weekInfo[week].finalizedLineup[pos as Position];
          players.forEach((player, i) => {
            const data = playerData[player.sanitizedName];
            acc.push(
              <tr
                className={
                  pos === "bench" && i === 0 ? styles["top-bordered-row"] : ""
                }
                key={player.fullName + pos + i.toString()}
              >
                <td className={`${styles["gray-col"]}`}>
                  <span>{player.lineup}</span>
                </td>
                <td className={`${styles["gray-col"]}`}>
                  <span>{player.position}</span>
                </td>
                <td className={`sticky-td sticky-col ${styles["gray-col"]}`}>
                  {player.fullName}
                </td>
                <td className={`${styles["gray-col"]}`}>
                  <InlineTeamTile team={player.team} />
                </td>
                <td className="align-items-center">
                  <span>
                    {(data?.scoring?.totalPoints === 0
                      ? 0
                      : data?.scoring?.totalPoints?.toFixed(2)) || 0}
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
);
