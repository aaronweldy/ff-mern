declare class FinalizedPlayer$1 {
    name: string;
    position: SinglePosition$1;
    lineup: Position$1;
    backup: string;
    constructor(name: string, position: SinglePosition$1, lineup: Position$1);
}
declare class RosteredPlayer {
    name: string;
    position: SinglePosition$1;
    constructor(name: string, pos: SinglePosition$1);
}
declare type SinglePosition$1 = "QB" | "RB" | "WR" | "TE" | "K";
declare type Position$1 = "QB" | "RB" | "WR" | "TE" | "K" | "WR/RB" | "WR/RB/TE" | "QB/WR/RB/TE" | "bench";
declare type PositionInfo = Record<Position$1, number>;
declare const positionTypes: Position$1[];
declare const emptyDefaultPositions: PositionInfo;

declare class FinalizedPlayer {
    name: string;
    position: SinglePosition;
    lineup: Position;
    backup: string;
    constructor(name: string, position: SinglePosition, lineup: Position);
}
declare type SinglePosition = "QB" | "RB" | "WR" | "TE" | "K";
declare type Position = "QB" | "RB" | "WR" | "TE" | "K" | "WR/RB" | "WR/RB/TE" | "QB/WR/RB/TE" | "bench";
declare type StatKey$1 = "20+" | "ATT" | "FL" | "FPTS" | "FPTS/G" | "G" | "LG" | "Player" | "REC" | "ROST" | "Rank" | "TD" | "TD_2" | "TGT" | "Y/R" | "YDS" | "YDS_2" | "ATT_2" | "Y/A" | "PCT" | "INT" | "1-19" | "20-29" | "30-39" | "40-49" | "50+" | "XPT";
declare type DatabasePlayer$1 = Record<StatKey$1, string>;

declare class Team {
    name: string;
    id: string;
    league: string;
    leagueLogo: string;
    leagueName: string;
    logo: string;
    owner: string;
    ownerName: string;
    isCommissioner: boolean;
    rosteredPlayers: RosteredPlayer[];
    weekInfo: TeamWeekInfo[];
    constructor(name: string, league: string, ownerName: string, isCommissioner: boolean, numWeeks: number);
    static updateNumWeeks(team: Team, numWeeks: number): void;
    static sumWeekScore(team: Team, week: number): number;
}
declare type TeamWeekInfo = {
    weekScore: number;
    addedPoints: number;
    finalizedLineup: FinalizedLineup;
};
declare type FinalizedLineup = Record<Position$1, FinalizedPlayer$1[]>;
declare const lineupToIterable: (lineup: FinalizedLineup) => FinalizedPlayer$1[];

declare type ScoringCategory = "ATT" | "PASS YD" | "REC YD" | "RUSH YD" | "CARRIES" | "YD PER CARRY" | "YD PER CATCH" | "REC" | "TARGETS" | "PASS TD" | "RUSH TD" | "REC TD" | "YD PER ATT" | "YD PER COMPLETION" | "CP%" | "INT" | "FUM" | "XPT" | "FG 1-19" | "FG 20-29" | "FG 30-39" | "FG 40-49" | "FG 50+" | "FG/XP MISS";
declare type Qualifier = "per" | "between" | "greater than" | "test";
declare type ScoringMinimum = {
    statType: ScoringCategory;
    threshold: number;
};
declare type FullCategory = {
    qualifier: Qualifier;
    statType: ScoringCategory;
    threshold: number;
    thresholdMin?: number;
    thresholdMax?: number;
};
declare type ScoringSetting = {
    category: FullCategory;
    minimums: ScoringMinimum[];
    points: number;
    position: Position$1;
};
declare type ErrorType = "NOT FOUND" | "POSSIBLE BACKUP";
declare class ScoringError {
    type: ErrorType;
    desc: string;
    player: FinalizedPlayer;
    team: Team;
    constructor(type: ErrorType, desc: string, player: FinalizedPlayer, team: Team);
}
declare type StatKey = "20+" | "ATT" | "FL" | "FPTS" | "FPTS/G" | "G" | "LG" | "Player" | "REC" | "ROST" | "Rank" | "TD" | "TD_2" | "TGT" | "Y/R" | "YDS" | "YDS_2" | "ATT_2" | "Y/A" | "PCT" | "INT" | "1-19" | "20-29" | "30-39" | "40-49" | "50+" | "XPT";
declare type DatabasePlayer = Record<StatKey, string>;

declare type LineupSettings = Record<Position$1, number>;
declare class League {
    name: string;
    logo: string;
    commissioners: string[];
    scoringSettings: ScoringSetting[];
    lineupSettings: LineupSettings;
    lastScoredWeek: number;
    numWeeks: number;
    constructor(name: string, commissioners: string[], numWeeks: number, lineupSettings: LineupSettings, logo: string);
}

declare type GenericRequest = {
    [key: string]: any;
};
declare type LeagueAPIResponse = {
    teams: Team[];
    league: League;
};
declare type PlayerScoreData = {
    [key: string]: {
        statistics: DatabasePlayer$1;
        scoring: {
            totalPoints: number;
            categories: Record<string, number>;
        };
    };
};
declare type PlayerScoresResponse = {
    players: PlayerScoreData;
} & LeagueAPIResponse;
declare type FetchPlayerScoresRequest = {
    leagueId: string;
    week: number;
    players?: string[];
};
declare type RunScoresResponse = {
    teams: Team[];
    errors: ScoringError[];
    data: PlayerScoreData;
};

type types_d_GenericRequest = GenericRequest;
type types_d_LeagueAPIResponse = LeagueAPIResponse;
type types_d_PlayerScoreData = PlayerScoreData;
type types_d_PlayerScoresResponse = PlayerScoresResponse;
type types_d_FetchPlayerScoresRequest = FetchPlayerScoresRequest;
type types_d_RunScoresResponse = RunScoresResponse;
declare namespace types_d {
  export {
    types_d_GenericRequest as GenericRequest,
    types_d_LeagueAPIResponse as LeagueAPIResponse,
    types_d_PlayerScoreData as PlayerScoreData,
    types_d_PlayerScoresResponse as PlayerScoresResponse,
    types_d_FetchPlayerScoresRequest as FetchPlayerScoresRequest,
    types_d_RunScoresResponse as RunScoresResponse,
  };
}

declare class API {
    static serverAddress: string;
    static fetchLeague(leagueId: string): Promise<LeagueAPIResponse>;
    static runScores(id: string, week: number, teams: Team[]): Promise<RunScoresResponse>;
    static fetchPlayerScores({ leagueId, week, players, }: FetchPlayerScoresRequest): Promise<PlayerScoresResponse>;
    static updateTeams(teams: Team[]): Promise<Team[]>;
}

declare const sanitizePlayerName: (name: string) => string;

export { API, types_d as ApiTypes, DatabasePlayer, ErrorType, FinalizedLineup, FinalizedPlayer$1 as FinalizedPlayer, FullCategory, League, LineupSettings, Position$1 as Position, PositionInfo, Qualifier, RosteredPlayer, ScoringCategory, ScoringError, ScoringMinimum, ScoringSetting, SinglePosition$1 as SinglePosition, StatKey, Team, TeamWeekInfo, emptyDefaultPositions, lineupToIterable, positionTypes, sanitizePlayerName };
