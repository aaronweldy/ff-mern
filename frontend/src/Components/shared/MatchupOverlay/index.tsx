import React from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { AbbreviatedNflTeam, TeamSchedule, Week, TeamFantasyPositionPerformance, AbbreviationToFullTeam, FinalizedPlayer } from "@ff-mern/ff-types";
import { NflRankedText } from "../NflRankedText";
import { InlineTeamTile } from "../InlineTeamTile";
import { playerTeamIsNflAbbreviation } from "@ff-mern/ff-types";

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
        if (withHomeAway) {
            return opp[week].isHome ? opp[week].opponent : `@${opp[week].opponent}`;
        }
        return opp[week].opponent;
    }
    return "BYE";
}

export const MatchupOverlay: React.FC<MatchupOverlayProps> = ({
    player,
    opponentTeam,
    week,
    nflDefenseStats,
}) => {
    return (
        <OverlayTrigger
            placement="top"
            overlay={
                <Tooltip id={`tooltip-${player.fullName}`}>
                    Matchup vs. Position: {
                        playerTeamIsNflAbbreviation(formatNflOpponent(opponentTeam, week)) &&
                            formatNflOpponent(opponentTeam, week) !== "BYE" ? (
                            <NflRankedText
                                rank={
                                    nflDefenseStats[
                                    AbbreviationToFullTeam[formatNflOpponent(opponentTeam, week) as AbbreviatedNflTeam]
                                    ][player.position]
                                }
                            />
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