import { Team, League } from "@ff-mern/ff-types";
import { Table, OverlayTrigger, Tooltip, Image } from "react-bootstrap";

type CumulativeScoreTableProps = {
  teams: Team[];
  league: League;
  id: string;
};

export const CumulativeScoreTable = ({
  teams,
  league,
  id,
}: CumulativeScoreTableProps) => (
  <Table striped hover className="hide-cells centered-scrollable-table">
    <thead>
      <tr>
        <th />
        <th>Team Name</th>
        <th>Team Owner</th>
        {[
          ...Array(league.numWeeks)
            .fill(0)
            .map((_, i) => <th key={i}>{i + 1}</th>),
        ]}
        <th>Total Points</th>
      </tr>
    </thead>
    <tbody>
      {teams.map((team, i) => {
        const linked =
          team.ownerName !== "default" ? (
            <a href={`/user/${team.owner}/`}>{team.ownerName}</a>
          ) : (
            team.ownerName
          );
        return (
          <tr key={i}>
            <td>
              <Image
                className="thumbnail-image"
                src={team.logo || process.env.REACT_APP_DEFAULT_LOGO}
              />
            </td>
            <td>
              <a href={`/league/${id}/team/${team.id}/`}>{team.name}</a>
            </td>
            <td>
              {league && league.commissioners.includes(team.owner) ? (
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip id={i.toString()}>Commissioner</Tooltip>}
                >
                  <span>
                    <b>{linked}</b>
                  </span>
                </OverlayTrigger>
              ) : (
                <span>{linked}</span>
              )}
            </td>
            {[
              ...Array(league.numWeeks)
                .fill(0)
                .map((_, idx) => (
                  <td key={idx}>
                    {(
                      team.weekInfo[idx + 1].weekScore +
                      team.weekInfo[idx + 1].addedPoints
                    ).toFixed(2)}
                  </td>
                )),
            ]}
            <td>
              {team.weekInfo
                .reduce(
                  (acc, _, week) => acc + Team.sumWeekScore(team, week),
                  0
                )
                .toFixed(2)}
            </td>
          </tr>
        );
      })}
    </tbody>
  </Table>
);
