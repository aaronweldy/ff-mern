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
    player: FinalizedPlayer;
    team: Team;
    constructor(type: ErrorType, desc: string, player: FinalizedPlayer, team: Team);
}
declare type StatKey = "20+" | "ATT" | "CMP" | "Y/CMP" | "FL" | "FPTS" | "FPTS/G" | "G" | "LG" | "Player" | "REC" | "ROST" | "Rank" | "TD" | "TD_2" | "TGT" | "Y/R" | "YDS" | "YDS_2" | "ATT_2" | "Y/A" | "PCT" | "INT" | "1-19" | "20-29" | "30-39" | "40-49" | "50+" | "XPT" | "team" | "position" | "snaps";
declare type DatabasePlayer = Record<StatKey, string>;

declare class FinalizedPlayer {
    name: string;
    position: SinglePosition;
    team: AbbreviatedNflTeam | "";
    lineup: Position;
    backup: string;
    constructor(name: string, position: SinglePosition, team: AbbreviatedNflTeam | "", lineup: Position);
}
declare class RosteredPlayer {
    name: string;
    position: SinglePosition;
    team: AbbreviatedNflTeam;
    constructor(name: string, team: AbbreviatedNflTeam, pos: SinglePosition);
}
declare type SinglePosition = "QB" | "RB" | "WR" | "TE" | "K";
declare type Position = "QB" | "RB" | "WR" | "TE" | "K" | "WR/RB" | "WR/RB/TE" | "QB/WR/RB/TE" | "bench";
declare type PositionInfo = Record<Position, number>;
declare const positionTypes: Position[];
declare const emptyDefaultPositions: PositionInfo;
declare type CumulativePlayerScore = {
    position: SinglePosition;
    totalPointsInSeason: number;
    pointsByWeek: number[];
};
declare type CumulativePlayerScores = Record<string, CumulativePlayerScore>;

declare class Team {
    name: string;
    leagueName: string;
    ownerName: string;
    isCommissioner: boolean;
    id: string;
    league: string;
    leagueLogo: string;
    logo: string;
    owner: string;
    rosteredPlayers: RosteredPlayer[];
    weekInfo: TeamWeekInfo[];
    lastUpdated: Date;
    constructor(name: string, leagueName: string, ownerName: string, isCommissioner: boolean, numWeeks: number);
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

declare type GenericRequest = {
    [key: string]: any;
};
declare type LeagueAPIResponse = {
    teams: Team[];
    league: League;
};
declare type StoredPlayerInformation = {
    team: AbbreviatedNflTeam;
    position: SinglePosition;
    statistics: DatabasePlayer;
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
declare type FantasyPerformanceByPosition = Record<SinglePosition, number>;
declare type TeamFantasyPositionPerformance = Record<FullNflTeam, FantasyPerformanceByPosition>;
declare type TeamToSchedule = Record<AbbreviatedNflTeam, Record<Week, AbbreviatedNflTeam | "BYE">>;

declare const sanitizePlayerName: (name: string) => string;
declare const sanitizeNflScheduleTeamName: (name: string) => string;
declare const convertedScoringTypes: Record<SinglePosition, Partial<Record<ScoringCategory, StatKey>>>;
declare const scoringTypes: string[];

declare type FullNflTeam = "green bay packers" | "pittsburgh steelers" | "kansas city chiefs" | "new england patriots" | "buffalo bills" | "carolina panthers" | "seattle seahawks" | "indianapolis colts" | "arizona cardinals" | "baltimore ravens" | "houston texans" | "new orleans saints" | "philadelphia eagles" | "denver broncos" | "detroit lions" | "minnesota vikings" | "atlanta falcons" | "new york giants" | "dallas cowboys" | "jacksonville jaguars" | "miami dolphins" | "cincinnati bengals" | "las vegas raiders" | "tampa bay buccaneers" | "los angeles rams" | "chicago bears" | "cleveland browns" | "los angeles chargers" | "san francisco 49ers" | "new york jets" | "washington commanders" | "tennessee titans";
declare type AbbreviatedNflTeam = "ARI" | "ATL" | "BAL" | "BUF" | "CAR" | "CHI" | "CIN" | "CLE" | "DAL" | "DEN" | "DET" | "GB" | "HOU" | "IND" | "JAC" | "JAX" | "KC" | "LAC" | "LAR" | "LV" | "MIA" | "MIN" | "NE" | "NO" | "NYG" | "NYJ" | "PHI" | "PIT" | "SEA" | "SF" | "TB" | "TEN" | "WAS" | "WSH";
declare const AbbreviationToFullTeam: Record<AbbreviatedNflTeam, FullNflTeam>;
declare type Week = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "11" | "12" | "13" | "14" | "15" | "16" | "17" | "18";

export { AbbreviatedNflTeam, AbbreviationToFullTeam, CumulativePlayerScore, CumulativePlayerScores, DatabasePlayer, ErrorType, FantasyPerformanceByPosition, FetchPlayerScoresRequest, FinalizedLineup, FinalizedPlayer, FullCategory, FullNflTeam, GenericRequest, League, LeagueAPIResponse, LineupSettings, PlayerScoreData, PlayerScoresResponse, Position, PositionInfo, Qualifier, RosteredPlayer, RunScoresResponse, ScoringCategory, ScoringError, ScoringMinimum, ScoringSetting, SinglePosition, StatKey, StoredPlayerInformation, Team, TeamFantasyPositionPerformance, TeamToSchedule, TeamWeekInfo, Week, convertedScoringTypes, emptyDefaultPositions, lineupToIterable, positionTypes, sanitizeNflScheduleTeamName, sanitizePlayerName, scoringTypes };
