declare class FinalizedPlayer {
    name: string;
    position: SinglePosition;
    lineup: Position;
    backup: string;
    constructor(name: string, position: SinglePosition, lineup: Position);
}
declare class RosteredPlayer {
    name: string;
    position: SinglePosition;
    constructor(name: string, pos: SinglePosition);
}
declare type SinglePosition = "QB" | "RB" | "WR" | "TE" | "K";
declare type Position = "QB" | "RB" | "WR" | "TE" | "K" | "WR/RB" | "WR/RB/TE" | "QB/WR/RB/TE" | "bench";
declare type PositionInfo = Record<Position, number>;
declare const positionTypes: Position[];
declare const emptyDefaultPositions: PositionInfo;

declare class FinalizedPlayer$1 {
    name: string;
    position: SinglePosition$1;
    lineup: Position$1;
    backup: string;
    constructor(name: string, position: SinglePosition$1, lineup: Position$1);
}
declare type SinglePosition$1 = "QB" | "RB" | "WR" | "TE" | "K";
declare type Position$1 = "QB" | "RB" | "WR" | "TE" | "K" | "WR/RB" | "WR/RB/TE" | "QB/WR/RB/TE" | "bench";
declare type StatKey$1 = "20+" | "ATT" | "CMP" | "Y/CMP" | "FL" | "FPTS" | "FPTS/G" | "G" | "LG" | "Player" | "REC" | "ROST" | "Rank" | "TD" | "TD_2" | "TGT" | "Y/R" | "YDS" | "YDS_2" | "ATT_2" | "Y/A" | "PCT" | "INT" | "1-19" | "20-29" | "30-39" | "40-49" | "50+" | "XPT";
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
declare type FinalizedLineup = Record<Position, FinalizedPlayer[]>;
declare const lineupToIterable: (lineup: FinalizedLineup) => FinalizedPlayer[];

declare type ScoringCategory = "ATT" | "CMP" | "PASS YD" | "REC YD" | "RUSH YD" | "CARRIES" | "YD PER CARRY" | "YD PER CATCH" | "REC" | "TARGETS" | "PASS TD" | "RUSH TD" | "REC TD" | "YD PER ATT" | "YD PER COMPLETION" | "CP%" | "INT" | "FUM" | "XPT" | "FG 1-19" | "FG 20-29" | "FG 30-39" | "FG 40-49" | "FG 50+" | "FG/XP MISS";
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
    position: Position;
};
declare type ErrorType = "NOT FOUND" | "POSSIBLE BACKUP";
declare class ScoringError {
    type: ErrorType;
    desc: string;
    player: FinalizedPlayer$1;
    team: Team;
    constructor(type: ErrorType, desc: string, player: FinalizedPlayer$1, team: Team);
}
declare type StatKey = "20+" | "ATT" | "CMP" | "Y/CMP" | "FL" | "FPTS" | "FPTS/G" | "G" | "LG" | "Player" | "REC" | "ROST" | "Rank" | "TD" | "TD_2" | "TGT" | "Y/R" | "YDS" | "YDS_2" | "ATT_2" | "Y/A" | "PCT" | "INT" | "1-19" | "20-29" | "30-39" | "40-49" | "50+" | "XPT";
declare type DatabasePlayer = Record<StatKey, string>;

declare type LineupSettings = Record<Position, number>;
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
declare type StoredPlayerInformation = {
    statistics: DatabasePlayer$1;
    scoring: {
        totalPoints: number;
        categories: Record<string, number>;
    };
};
declare type PlayerScoreData = {
    [key: string]: StoredPlayerInformation;
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

declare class API {
    static serverAddress: string;
    static fetchLeague(leagueId: string): Promise<LeagueAPIResponse>;
    static runScores(id: string, week: number, teams: Team[]): Promise<RunScoresResponse>;
    static fetchPlayerScores({ leagueId, week, players, }: FetchPlayerScoresRequest): Promise<PlayerScoresResponse>;
    static updateTeams(teams: Team[]): Promise<Team[]>;
}

declare const sanitizePlayerName: (name: string) => string;
declare const convertedScoringTypes: Record<SinglePosition, Partial<Record<ScoringCategory, StatKey>>>;
declare const scoringTypes: string[];

export { API, DatabasePlayer, ErrorType, FetchPlayerScoresRequest, FinalizedLineup, FinalizedPlayer, FullCategory, GenericRequest, League, LeagueAPIResponse, LineupSettings, PlayerScoreData, PlayerScoresResponse, Position, PositionInfo, Qualifier, RosteredPlayer, RunScoresResponse, ScoringCategory, ScoringError, ScoringMinimum, ScoringSetting, SinglePosition, StatKey, StoredPlayerInformation, Team, TeamWeekInfo, convertedScoringTypes, emptyDefaultPositions, lineupToIterable, positionTypes, sanitizePlayerName, scoringTypes };
