import { getCurrentPickInfo } from "@ff-mern/ff-types";
import { useCallback, useMemo } from "react";
import { Col, Row } from "react-bootstrap";
import { useTeams } from "../../../../hooks/query/useTeams";
import { TeamLogoBubble } from "../../../shared/TeamLogoBubble";
import { useStore } from "../../store";
import "./style.css";

export const PickTable = () => {
  const draftState = useStore((store) => store.state);
  const curPick = useMemo(() => {
    if (draftState) {
      return getCurrentPickInfo(draftState);
    }
  }, [draftState]);
  const elRef = useCallback((el: HTMLDivElement | null) => {
    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    }
  }, []);

  const { query: teamsQuery } = useTeams(draftState?.leagueId || "");
  const picks = useMemo(() => {
    if (!draftState) {
      return [];
    }
    return Object.keys(draftState.selections).map((round) => {
      const selectionsInRound = draftState.selections[round];
      let reversed = false;
      if (
        draftState.settings.pickOrder === "snake" &&
        parseInt(round) % 2 === 1
      ) {
        selectionsInRound.reverse();
        reversed = true;
      }
      return (
        <Row key={round} className="flex-nowrap">
          <Col className="d-flex align-items-center">
            <span>
              <b>Round {parseInt(round) + 1}</b>
            </span>
          </Col>
          {selectionsInRound.map((selection, pInR) => {
            const isCurPick =
              curPick &&
              curPick.round === parseInt(round) &&
              curPick.pickInRound ===
                (reversed ? selectionsInRound.length - pInR : pInR);
            return (
              <Col
                key={selection.pick}
                data-position={selection.player?.position}
                className={`pick-box ${isCurPick ? "cur-pick" : ""}`}
                ref={isCurPick ? elRef : null}
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
                        <span className="text-center">
                          {selection.player.fullName}
                        </span>
                      </div>
                      <span className="position-text">
                        {selection.player.position} -{" "}
                        {selection.player.team}
                      </span>
                    </>
                  )}
                </div>
              </Col>
            );
          })}
        </Row>
      );
    })
  }, [draftState, curPick, elRef]);
  if (!draftState || !teamsQuery.isSuccess) {
    return <div>Loading draft...</div>;
  }
 
  return (
    <div className="pick-container">
      <div className="pick-grid">
        {picks}
      </div>
    </div>
  );
};
