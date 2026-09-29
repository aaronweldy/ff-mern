import { Team } from "@ff-mern/ff-types";
import { Table } from "react-bootstrap";

type TeamFooterProps = {
  team: Team;
  week: number;
};

export const TeamFooter = ({ team, week }: TeamFooterProps) => (
  <Table striped bordered className="score-summary">
    <tbody>
      <tr>
        <th scope="row">Point Adjustment</th>
        <td>{team.weekInfo[week].addedPoints}</td>
      </tr>
      <tr>
        <th scope="row">Total points</th>
        <td>{Team.sumWeekScore(team, week).toFixed(2)}</td>
      </tr>
    </tbody>
  </Table>
);
