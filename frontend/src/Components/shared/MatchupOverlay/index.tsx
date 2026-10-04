import { DefenseStatsMetadata } from "../../../hooks/query/useNflDefenseStats";
import React, { useId, useRef, useState } from "react";
import { Overlay, Tooltip } from "react-bootstrap";
import {
  AbbreviatedNflTeam,
  AbbreviationToFullTeam,
  TeamSchedule,
  Week,
  TeamFantasyPositionPerformance,
  FinalizedPlayer,
  FullTeamToAbbreviation,
  FullNflTeam,
} from "@ff-mern/ff-types";
import { NflRankedText } from "../NflRankedText";
import { InlineTeamTile } from "../InlineTeamTile";

interface MatchupOverlayProps {
  player: FinalizedPlayer;
  opponentTeam: TeamSchedule | undefined;
  week: Week;
  nflDefenseStats: TeamFantasyPositionPerformance;
  metadata?: DefenseStatsMetadata;
}

const formatNflOpponent = (
  opp: TeamSchedule | undefined,
  week: Week,
  withHomeAway = false
) => {
  if (!opp) {
    return "n/a";
  }
  if (week in opp) {
    const opponent = opp[week].opponent;
    if (opponent === "BYE") {
      return "BYE";
    }
    if (withHomeAway) {
      // Schedule docs contain both full names ("los angeles chargers")
      // and legacy abbreviations ("LAC"). Pass abbreviations through so
      // InlineTeamTile never receives undefined.
      const abbr = (FullTeamToAbbreviation[opponent as FullNflTeam] ??
        opponent) as AbbreviatedNflTeam;
      return opp[week].isHome ? abbr : `@${abbr}`;
    }
    return opponent;
  }
  return "BYE";
};

export const MatchupOverlay: React.FC<MatchupOverlayProps> = ({
  player,
  opponentTeam,
  week,
  nflDefenseStats,
}) => {
  const tooltipId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const opponentCode = opponentTeam?.[week]?.opponent;
  const opponentName = (AbbreviationToFullTeam[
    opponentCode as AbbreviatedNflTeam
  ] ?? opponentCode) as FullNflTeam | undefined;
  // Defense stats can be empty or missing an opponent (e.g. stale schedule
  // format, "BYE", or a failed scrape). Never let a missing entry crash the
  // page — fall back to "n/a" like the no-game case.
  const rank = opponentName
    ? nflDefenseStats?.[opponentName]?.[player.position]
    : undefined;
  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") setShowTooltip(true);
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse") setShowTooltip(false);
        }}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(true)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setShowTooltip(false);
        }}
        aria-describedby={showTooltip ? tooltipId : undefined}
        className="matchup-trigger d-flex flex-column align-items-center"
        aria-label={`Matchup details for ${player.fullName}`}
      >
        <InlineTeamTile
          team={
            formatNflOpponent(opponentTeam, week, true) as AbbreviatedNflTeam
          }
        />
        <small>
          {opponentTeam && opponentTeam[week]?.gameTime && (
            <span className="text-muted">
              {new Date(opponentTeam[week].gameTime).toLocaleString(undefined, {
                weekday: "short",
                hour: "numeric",
                minute: "2-digit",
                timeZoneName: "short",
              })}
            </span>
          )}
        </small>
      </button>
      <Overlay
        target={triggerRef.current}
        show={showTooltip}
        placement="top"
        rootClose
        onHide={(event) => {
          if (triggerRef.current?.contains(event?.target as Node)) return;
          setShowTooltip(false);
        }}
      >
        <Tooltip id={tooltipId}>
          Matchup vs. Position:{" "}
          {rank != null ? <NflRankedText rank={rank} /> : "n/a"}
        </Tooltip>
      </Overlay>
    </>
  );
};
