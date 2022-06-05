import { Team } from "@ff-mern/ff-types";
import { useMemo } from "react";
import { Col, Row } from "react-bootstrap";
import { useTeams } from "../../../../hooks/query/useTeams";
import { useStore } from "../../store";
import "./style.css";

export const PickTable = () => {
  const draftState = useStore((store) => store.state);
  const { query: teamsQuery } = useTeams(draftState?.leagueId || "");
  const mapTeamToIds = useMemo(() => {
    console.log(teamsQuery.data);
    return teamsQuery.isSuccess && draftState
      ? teamsQuery.data.teams.reduce((acc: Record<string, Team>, team) => {
          acc[team.id] = team;
          return acc;
        }, {})
      : {};
  }, [teamsQuery.data, draftState, teamsQuery.isSuccess]);
  if (!draftState || !teamsQuery.isSuccess) {
    return <div>Loading draft...</div>;
  }
  return (
    <div className="pick-container">
      <div className="pick-grid">
        {Object.keys(draftState.selections).map((round) => (
          <Row key={round} className="flex-nowrap">
            <Col className="d-flex align-items-center">
              <span>
                <b>Round {parseInt(round) + 1}</b>
              </span>
            </Col>
            {draftState.selections[round].map((selection) => (
              <Col key={selection.pick} className="pick-box">
                <div className="box-header">
                  <span className="pick-num">{selection.pick + 1}</span>
                </div>
                <span>{mapTeamToIds[selection.selectedBy].name}</span>
              </Col>
            ))}
          </Row>
        ))}
      </div>
    </div>
  );
};
