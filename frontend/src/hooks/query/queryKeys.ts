export const queryKeys = {
  league: (leagueId: string) => ["league", leagueId] as const,
  teams: (leagueId: string) => ["teams", leagueId] as const,
  team: (teamId?: string) => ["team", teamId] as const,
  allTeams: () => ["team"] as const,
  teamsForUser: (userId?: string) => ["teamsForUser", userId] as const,
  players: () => ["players"] as const,
  playerScores: (leagueId: string, week: number) =>
    ["playerScores", leagueId, week] as const,
  cumulativePlayerScores: (leagueId: string) =>
    ["cumulativePlayerScores", leagueId] as const,
  nflSchedule: () => ["nflSchedule"] as const,
  nflDefenseStats: () => ["nflDefenseStats"] as const,
  draftForLeague: (leagueId: string) => ["draftForLeague", leagueId] as const,
  trades: (userId?: string) => ["trades", userId] as const,
  commissionerCheck: (leagueId: string, userId?: string) =>
    ["commissionerCheck", leagueId, userId] as const,
};
