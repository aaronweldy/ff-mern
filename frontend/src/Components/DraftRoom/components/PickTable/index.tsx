import { getCurrentPickInfo } from "@ff-mern/ff-types";
import { useLayoutEffect, useMemo, useRef } from "react";
import { Col, Row } from "react-bootstrap";
import { useTeams } from "../../../../hooks/query/useTeams";
import { TeamLogoBubble } from "../../../shared/TeamLogoBubble";
import { useStore } from "../../store";
import "./style.css";

export const PickTable = () => {
  const draftState = useStore((store) => store.state);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const curPick = useMemo(() => {
    if (draftState) {
      return getCurrentPickInfo(draftState);
    }
  }, [draftState]);
  useLayoutEffect(() => {
    const div = scrollRef.current;
    if (div && draftState) {
      div.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    }
  }, [draftState, scrollRef]);
  const { query: teamsQuery } = useTeams(draftState?.leagueId || "");
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
            {draftState.selections[round].map((selection, pInR) => (
              <Col
                key={selection.pick}
                data-position={selection.player?.position}
                className={`pick-box`}
                ref={
                  curPick &&
                  curPick.round === parseInt(round) &&
                  curPick.pickInRound === pInR
                    ? scrollRef
                    : null
                }
              >
                <div className="box-header">
                  <span className="pick-num">{selection.pick + 1}</span>
                  <span>{selection.selectedBy.name}</span>
                </div>
                <div className="box-body">
                  {selection.player && (
                    <>
                      <div className="pick-body-row">
                        <TeamLogoBubble team={selection.player.team} />
                        <span>{selection.player.fullName}</span>
                      </div>
                      <span className="position-text">
                        {selection.player.position} - {selection.player.team}
                      </span>
                    </>
                  )}
                </div>
              </Col>
            ))}
          </Row>
        ))}
      </div>
    </div>
  );
};
