import { Team } from "@ff-mern/ff-types";
import { useId, useRef, useState } from "react";
import { Overlay, Table, Tooltip } from "react-bootstrap";
import "./styles.css";

type TeamFooterProps = {
  team: Team;
  week: number;
};

export const TeamFooter = ({ team, week }: TeamFooterProps) => {
  const [showAdjustment, setShowAdjustment] = useState(false);
  const scoreRef = useRef<HTMLButtonElement>(null);
  const tooltipId = useId();
  const adjustment = team.weekInfo[week].addedPoints;

  return (
    <Table striped bordered className="score-summary">
      <tbody>
        <tr>
          <th scope="row">Total points</th>
          <td>
            <button
              ref={scoreRef}
              type="button"
              className="score-adjustment-trigger"
              aria-label={`Total points: ${Team.sumWeekScore(team, week).toFixed(2)}. Show point adjustment`}
              aria-describedby={showAdjustment ? tooltipId : undefined}
              onPointerEnter={(event) => {
                if (event.pointerType === "mouse") setShowAdjustment(true);
              }}
              onPointerLeave={(event) => {
                if (event.pointerType === "mouse") setShowAdjustment(false);
              }}
              onFocus={() => setShowAdjustment(true)}
              onBlur={() => setShowAdjustment(false)}
              onClick={() => setShowAdjustment(true)}
            >
              {Team.sumWeekScore(team, week).toFixed(2)}
            </button>
            <Overlay
              target={scoreRef.current}
              show={showAdjustment}
              placement="top"
              rootClose
              onHide={(event) => {
                if (
                  event.type === "keyup" ||
                  !scoreRef.current?.contains(event.target as Node)
                ) {
                  setShowAdjustment(false);
                }
              }}
            >
              {(props) => (
                <Tooltip {...props} id={tooltipId}>
                  Point adjustment: {adjustment > 0 ? "+" : ""}{adjustment}
                </Tooltip>
              )}
            </Overlay>
          </td>
        </tr>
      </tbody>
    </Table>
  );
};
