import React from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { AbbreviatedNflTeam, TeamSchedule, Week, TeamFantasyPositionPerformance, FinalizedPlayer, FullTeamToAbbreviation, FullNflTeam } from "@ff-mern/ff-types";
import { NflRankedText } from "../NflRankedText";
import { InlineTeamTile } from "../InlineTeamTile";

interface MatchupOverlayProps {
    player: FinalizedPlayer;
    opponentTeam: TeamSchedule | undefined;
    week: Week;
    nflDefenseStats: TeamFantasyPositionPerformance;
}

const formatNflOpponent = (opp: TeamSchedule | undefined, week: Week, withHomeAway = false) => {
    if (!opp) {
        return "n/a"
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
            const abbr = (FullTeamToAbbreviation[opponent as FullNflTeam] ?? opponent) as AbbreviatedNflTeam;
            return opp[week].isHome ? abbr : `@${abbr}`;
        }
        return opponent;
    }
    return "BYE";
}

export const MatchupOverlay: React.FC<MatchupOverlayProps> = ({
    player,
    opponentTeam,
    week,
    nflDefenseStats,
}) => {
    const opponentName = opponentTeam?.[week]?.opponent as FullNflTeam | undefined;
    // Defense stats can be empty or missing an opponent (e.g. stale schedule
    // format, "BYE", or a failed scrape). Never let a missing entry crash the
    // page — fall back to "n/a" like the no-game case.
    const rank = opponentName
        ? nflDefenseStats?.[opponentName]?.[player.position]
        : undefined;
    return (
        <OverlayTrigger
            placement="top"
            overlay={
                <Tooltip id={`tooltip-${player.fullName}`}>
                    Matchup vs. Position: {
                        rank != null ? (
                            <NflRankedText rank={rank} />
                        ) : (
                            "n/a"
                        )
                    }
                </Tooltip>
            }
        >
            <div className="d-flex flex-column align-items-center">
                <InlineTeamTile
                    team={formatNflOpponent(opponentTeam, week, true) as AbbreviatedNflTeam}
                />
                <small>
                    {opponentTeam && opponentTeam[week]?.gameTime && (
                        <span className="text-muted">
                            {new Date(opponentTeam[week].gameTime).toLocaleString(undefined, {
                                weekday: 'short',
                                hour: 'numeric',
                                minute: '2-digit',
                                timeZoneName: 'short'
                            })}
                        </span>
                    )}
                </small>
            </div>
        </OverlayTrigger>
    );
};