import { CumulativePlayerScores } from "@ff-mern/ff-types";
import { Col, Row, Table } from "react-bootstrap";
import { capitalizePlayerName } from "../../utils/capitalizePlayerName";

export type CumulativePlayerTableProps = {
  players: CumulativePlayerScores;
};

export const CumulativePlayerTable = ({
  players,
}: CumulativePlayerTableProps) => {
  return (
    <Row className="justify-content-center mt-3">
      <Col>
        <Table responsive="lg" striped bordered className="scrollable-table">
          <thead>
            <tr>
              <th
                style={{ zIndex: 3 }}
                className="sticky-th sticky-col sticky-td"
              >
                Player Name
              </th>
              <th className="sticky-th">Position</th>
              <th className="sticky-th">Total Points</th>
              <th className="sticky-th">Average</th>
              {[...Array(18).keys()].map((iter) => (
                <th key={iter} className="sticky-th">
                  {iter + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.keys(players).map((player) => {
              const playerData =
                player in players
                  ? players[player]
                  : {
                      position: "QB",
                      totalPointsInSeason: 0,
                      pointsByWeek: Array(19).fill(0),
                    };
              return (
                <tr key={player}>
                  <td className="sticky-col sticky-td">
                    {capitalizePlayerName(player)}
                  </td>
                  <td>{playerData.position}</td>
                  <td>{playerData.totalPointsInSeason.toFixed(2)}</td>
                  <td>
                    {(
                      playerData.totalPointsInSeason /
                      Math.max(
                        playerData.pointsByWeek.reduce(
                          (acc: number, weekScore: number) => {
                            return weekScore > 0 ? acc + 1 : acc;
                          },
                          0
                        ),
                        1
                      )
                    ).toFixed(2)}
                  </td>
                  {playerData.pointsByWeek.map((points, i) => (
                    <td key={points.toString() + i.toString()}>
                      {points.toFixed(2)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Col>
    </Row>
  );
};
