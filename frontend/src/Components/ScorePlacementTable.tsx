import { Table } from "react-bootstrap";
import React from "react";
import { Team } from "../ff-types/types";

const backgroundIters = [
  "first-background",
  "second-background",
  "third-background",
];

type ScorePlacementTableProps = {
  teams: Team[];
  week: number;
};

const ScorePlacementTable = ({ teams, week }: ScorePlacementTableProps) => {
  const teamSorter = (a: Team, b: Team) =>
    b.weekScores[week] +
    (b.addedPoints[week] || 0) -
    (a.weekScores[week] + (a.addedPoints[week] || 0));
  return (
    <Table striped bordered hover className="table-width">
      <thead>
        <tr>
          <th>Place</th>
          <th>Team Name</th>
          <th>Points</th>
        </tr>
      </thead>
      <tbody>
        {teams.sort(teamSorter).map((team, i) => (
          <tr key={i} id={i <= 2 ? backgroundIters[i] : ""}>
            <td>{i + 1}</td>
            <td>{team.name}</td>
            <td>
              {(
                (team.weekScores[week] || 0) + (team.addedPoints[week] || 0)
              ).toFixed(2)}
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default ScorePlacementTable;
