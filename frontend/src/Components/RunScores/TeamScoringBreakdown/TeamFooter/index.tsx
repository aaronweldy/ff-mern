import { Team } from "@ff-mern/ff-types";
import { Table } from "react-bootstrap";

type TeamFooterProps = {
  team: Team;
  week: number;
};

export const TeamFooter = ({ team, week }: TeamFooterProps) => (
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
);
