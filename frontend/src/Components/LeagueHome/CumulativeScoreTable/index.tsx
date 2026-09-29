import { League, Team } from "@ff-mern/ff-types";
import { Table } from "react-bootstrap";
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
  <Table striped hover className="league-standings-table">
    <thead>
      <tr>
        <th scope="col" className="standings-team">
          Team
        </th>
        <th scope="col" className="standings-total">
          Total Points
        </th>
        {[
          ...Array(league.numWeeks)
            .fill(0)
            .map((_, i) => (
              <th scope="col" key={i}>
                Week {i + 1}
              </th>
            )),
        ]}
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
          <tr key={team.id}>
            <th scope="row" className="standings-team">
              <div className="standings-team-identity">
                <StableImage
                  size="thumbnail"
                  src={team.logo || import.meta.env.VITE_DEFAULT_LOGO}
                  alt=""
                />
                <div className="standings-team-copy">
                  <div className="standings-team-title">
                    <span className="standings-rank">
                      <span className="sr-only">Rank </span>
                      {i + 1}
                    </span>
                    <a href={`/league/${id}/team/${team.id}/`}>{team.name}</a>
                  </div>
                  <div className="standings-owner">
                    {league && league.commissioners.includes(team.owner) ? (
                      <span>
                        {linked}
                        <small className="d-block">Commissioner</small>
                      </span>
                    ) : (
                      <span>{linked}</span>
                    )}
                  </div>
                </div>
              </div>
            </th>
            <td className="standings-total">
              {team.weekInfo
                .reduce(
                  (acc, _, week) => acc + Team.sumWeekScore(team, week),
                  0
                )
                .toFixed(2)}
            </td>
            {[
              ...Array(league.numWeeks)
                .fill(0)
                .map((_, idx) => (
                  <td key={idx}>
                    {(
                      (team.weekInfo[idx + 1]?.weekScore || 0) +
                      (team.weekInfo[idx + 1]?.addedPoints || 0)
                    ).toFixed(2)}
                  </td>
                )),
            ]}
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
  const columns = numWeeks + 2;

  return (
    <div className="league-table-loading" role="status" aria-live="polite">
      <span className="sr-only">Loading league standings</span>
      <Table
        className="league-standings-table league-table-loading__table"
        aria-hidden="true"
      >
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
