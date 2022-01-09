import React from "react";
import {
  Row,
  Col,
  Table,
  OverlayTrigger,
  Image,
  Tooltip,
} from "react-bootstrap";
import { ScoringSetting } from "../../ff-types/Scoring";
import { Team } from "../../ff-types/Team";

type TeamScoringBreakdownProps = {
  league: ScoringSetting[];
  team: Team;
  week: number;
};

const TeamScoringBreakdown = ({
  league,
  team,
  week,
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
            {team.players
              .filter((player) => player.lineup[week] !== "bench")
              .map((player, i) => {
                const nameCard = player.error ? (
                  <OverlayTrigger
                    key={i}
                    placement="top"
                    overlay={
                      <Tooltip id="tooltip-top">
                        Player not found in database. Make sure the name is
                        spelled correctly.
                      </Tooltip>
                    }
                  >
                    <td className="error-background">
                      <span>{player.name}</span>
                    </td>
                  </OverlayTrigger>
                ) : (
                  <td>
                    <span>{player.name}</span>
                  </td>
                );
                return (
                  <tr key={i}>
                    <td>
                      <span>{player.lineup[week]}</span>
                    </td>
                    <td>
                      <span>{player.position}</span>
                    </td>
                    {nameCard}
                    <td>
                      <span>{player.points[week]?.toFixed(2) || 0}</span>
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
                              {stat.position.indexOf(player.position) >= 0 &&
                              player.weekStats[week]
                                ? player.weekStats[week][hashVal]?.toFixed(2) ||
                                  0
                                : 0}
                            </td>
                          );
                        })
                      : null}
                  </tr>
                );
              })}
            <tr>
              <td colSpan={3}>
                <b>Point Adjustment</b>
              </td>
              <td>{team.addedPoints[week] || 0}</td>
            </tr>
            <tr>
              <td colSpan={3}>
                <b>Total points:</b>
              </td>
              <td>
                {(
                  (team.weekScores[week] || 0) + (team.addedPoints[week] || 0)
                ).toFixed(2)}
              </td>
            </tr>
          </tbody>
        </Table>
      </Row>
    </>
  );
};

export default TeamScoringBreakdown;
