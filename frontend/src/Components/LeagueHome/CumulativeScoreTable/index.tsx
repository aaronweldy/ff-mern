import { League, Team } from "@ff-mern/ff-types";
import { OverlayTrigger, Table, Tooltip } from "react-bootstrap";
import { StableImage } from "../../shared/StableImage";

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
              <StableImage
                size="thumbnail"
                src={team.logo || import.meta.env.VITE_DEFAULT_LOGO}
                alt="Team logo"
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
                      team.weekInfo[idx + 1]?.weekScore +
                      team.weekInfo[idx + 1]?.addedPoints
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

type CumulativeScoreTableLoadingStateProps = {
  numWeeks?: number;
  rows?: number;
};

export const CumulativeScoreTableLoadingState = ({
  numWeeks = 18,
  rows = 10,
}: CumulativeScoreTableLoadingStateProps) => {
  const columns = numWeeks + 4;

  return (
    <div className="league-table-loading" role="status" aria-live="polite">
      <span className="sr-only">Loading league standings</span>
      <Table className="league-table-loading__table" aria-hidden="true">
        <thead>
          <tr>
            {Array.from({ length: columns }, (_, index) => (
              <th key={`header-${index}`}>
                <div className="league-table-loading__line" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, rowIndex) => (
            <tr key={`row-${rowIndex}`}>
              {Array.from({ length: columns }, (_, cellIndex) => (
                <td key={`cell-${rowIndex}-${cellIndex}`}>
                  {cellIndex === 0 ? (
                    <div className="league-table-loading__logo" />
                  ) : (
                    <div className="league-table-loading__line" />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};
