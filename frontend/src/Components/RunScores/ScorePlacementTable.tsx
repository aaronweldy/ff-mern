import { Table } from "react-bootstrap";
import React from "react";
import { Team } from "@ff-mern/ff-types";

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
    Team.sumWeekScore(b, week) - Team.sumWeekScore(a, week);
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
                team.weekInfo[week].weekScore + team.weekInfo[week].addedPoints
              ).toFixed(2)}
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default ScorePlacementTable;
