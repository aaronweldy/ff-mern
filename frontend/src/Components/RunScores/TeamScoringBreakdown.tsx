import React from "react";
import {
  Row,
  Col,
  Table,
  OverlayTrigger,
  Image,
  Tooltip,
} from "react-bootstrap";
import {
  ApiTypes,
  Position,
  sanitizePlayerName,
  ScoringSetting,
} from "@ff-mern/ff-types";
import { Team } from "@ff-mern/ff-types";
import { lineupSorter } from "../../constants";
import "../../CSS/LeaguePages.css";

type TeamScoringBreakdownProps = {
  league: ScoringSetting[];
  team: Team;
  week: number;
  playerData: ApiTypes.PlayerScoreData;
};

const TeamScoringBreakdown = ({
  league,
  team,
  week,
  playerData,
}: TeamScoringBreakdownProps) => {
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
      <Row>
        <Table striped bordered hover className="table-width">
          <thead>
            <tr>
              <th>Lineup</th>
              <th>Position</th>
              <th>Player Name</th>
              <th>Points</th>
              {league
                ? league.map((stat, i) => {
                    const cat = stat.category;
                    return (
                      <th key={i}>
                        {cat.qualifier}{" "}
                        {cat.qualifier === "between"
                          ? `${cat.thresholdMin}/${cat.thresholdMax}`
                          : cat.threshold}{" "}
                        {cat.statType}
                      </th>
                    );
                  })
                : null}
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
                  console.log(data);
                  acc.push(
                    <tr
                      className={
                        pos === "bench" && i === 0 ? "top-bordered-row" : ""
                      }
                      key={player.name + pos + i.toString()}
                    >
                      <td>
                        <span>{player.lineup}</span>
                      </td>
                      <td>
                        <span>{player.position}</span>
                      </td>
                      <td>{player.name}</td>
                      <td>
                        <span>
                          {data?.scoring?.totalPoints?.toFixed(2) || 0}
                        </span>
                      </td>
                      {league
                        ? league.map((stat, idx) => {
                            const cat = stat.category;
                            const hashVal =
                              cat.qualifier === "between"
                                ? `${cat.qualifier}|${cat.thresholdMin}${cat.thresholdMax}|${cat.statType}`
                                : `${cat.qualifier}|${cat.threshold}|${cat.statType}`;
                            return (
                              <td key={idx}>
                                {(stat.position.indexOf(player.position) >= 0 &&
                                  data?.scoring?.categories[hashVal]?.toFixed(
                                    2
                                  )) ||
                                  0}
                              </td>
                            );
                          })
                        : null}
                    </tr>
                  );
                });
                return acc;
              }, [])}
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
