import { DecodedIdToken } from 'firebase-admin/auth';

declare type LineupSettings = Record<Position, number>;
declare const getNumPlayersFromLineupSettings: (settings: LineupSettings) => number;
declare class League {
    name: string;
    logo: string;
    commissioners: string[];
    scoringSettings: ScoringSetting[];
    lineupSettings: LineupSettings;
    lastScoredWeek: number;
    numWeeks: number;
    numSuperflex: number;
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

declare const setPlayerName: (player: FinalizedPlayer | RosteredPlayer, name: string) => void;
interface NflPlayer {
    fullName: string;
    sanitizedName: string;
    position: SinglePosition;
    team: AbbreviatedNflTeam | "None";
}
declare class FinalizedPlayer implements NflPlayer {
    fullName: string;
    sanitizedName: string;
    position: SinglePosition;
    team: AbbreviatedNflTeam | "None";
    lineup: Position;
    backup: string;
    constructor(name: string, position: SinglePosition, team: AbbreviatedNflTeam | "None", lineup: Position);
}
declare class RosteredPlayer implements NflPlayer {
    fullName: string;
    sanitizedName: string;
    position: SinglePosition;
    team: AbbreviatedNflTeam;
    constructor(name: string, team: AbbreviatedNflTeam, pos: SinglePosition);
}
declare type SinglePosition = "QB" | "RB" | "WR" | "TE" | "K";
declare type Position = "QB" | "RB" | "WR" | "TE" | "K" | "WR/RB" | "WR/RB/TE" | "QB/WR/RB/TE" | "bench";
declare type PositionInfo = Record<Position, number>;
declare const positionTypes: Position[];
declare const singlePositionTypes: SinglePosition[];
declare const emptyDefaultPositions: PositionInfo;
declare type CumulativePlayerScore = {
    position: SinglePosition;
    totalPointsInSeason: number;
    pointsByWeek: number[];
    team: AbbreviatedNflTeam;
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
    lastUpdated: string;
    constructor(name: string, leagueName: string, ownerName: string, isCommissioner: boolean, numWeeks: number);
    static updateNumWeeks(team: Team, numWeeks: number): void;
    static sumWeekScore(team: Team, week: number): number;
}
declare type TeamWeekInfo = {
    weekScore: number;
    addedPoints: number;
    finalizedLineup: FinalizedLineup;
    isSuperflex: boolean;
};
declare type FinalizedLineup = Record<Position, FinalizedPlayer[]>;
declare const lineupToIterable: (lineup: FinalizedLineup) => FinalizedPlayer[];

declare type DraftType = "mock" | "official";
declare type DraftPhase = "predraft" | "live" | "postdraft";
declare type DraftSettings = {
    type: DraftType;
    draftId: string;
    numRounds: number;
    draftOrder: string[];
    pickOrder: PickOrder;
};
declare type DraftPick = {
    pick: number;
    selectedBy: string;
    player: ProjectedPlayer | null;
};
interface DraftState {
    settings: DraftSettings;
    leagueId: string;
    currentPick: number;
    phase: DraftPhase;
    availablePlayers: ProjectedPlayer[];
    selections: Record<string, DraftPick[]>;
}
declare type PickOrder = "round-robin" | "snake";
declare const createDraftStateForLeague: (lineupSettings: LineupSettings, leagueId: string, teams: Team[], availablePlayers: ProjectedPlayer[], draftId: string, settings?: DraftSettings) => DraftState;

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
declare type TeamToSchedule = Record<FullNflTeam, Record<Week, AbbreviatedNflTeam | "BYE">>;
declare type ScrapedPlayerProjection = {
    Player: string;
    FPTS: string;
};
declare type SingleTeamResponse = {
    team: Team;
};
declare type QuicksetRequest = {
    week: Week;
    type: QuicksetLineupType;
    lineupSettings: LineupSettings;
};
declare type QuicksetLineupType = "LastWeek" | "Projection";
declare type UpdateAllTeamsResponse = {
    teams: Team[];
};
declare type ScrapedADPData = {
    Overall: string;
    "Player Team (Bye)": string;
    AVG: string;
    QB?: string;
    RB?: string;
    WR?: string;
    TE?: string;
    K?: string;
};
declare class ProjectedPlayer implements NflPlayer {
    fullName: string;
    sanitizedName: string;
    position: SinglePosition;
    team: AbbreviatedNflTeam | "None";
    byeWeek: Week;
    positionRank: string;
    overall: number;
    average: number;
}
declare type CreateDraftRequest = {
    leagueId: string;
    draftSettings: DraftSettings;
};

declare type FullNflTeam = "green bay packers" | "pittsburgh steelers" | "kansas city chiefs" | "new england patriots" | "buffalo bills" | "carolina panthers" | "seattle seahawks" | "indianapolis colts" | "arizona cardinals" | "baltimore ravens" | "houston texans" | "new orleans saints" | "philadelphia eagles" | "denver broncos" | "detroit lions" | "minnesota vikings" | "atlanta falcons" | "new york giants" | "dallas cowboys" | "jacksonville jaguars" | "miami dolphins" | "cincinnati bengals" | "las vegas raiders" | "tampa bay buccaneers" | "los angeles rams" | "chicago bears" | "cleveland browns" | "los angeles chargers" | "san francisco 49ers" | "new york jets" | "washington commanders" | "tennessee titans";
declare type AbbreviatedNflTeam = "ARI" | "ATL" | "BAL" | "BUF" | "CAR" | "CHI" | "CIN" | "CLE" | "DAL" | "DEN" | "DET" | "GB" | "HOU" | "IND" | "JAC" | "JAX" | "KC" | "LAC" | "LAR" | "LV" | "MIA" | "MIN" | "NE" | "NO" | "NYG" | "NYJ" | "PHI" | "PIT" | "SEA" | "SF" | "TB" | "TEN" | "WAS" | "WSH";
declare const AbbreviationToFullTeam: Record<AbbreviatedNflTeam, FullNflTeam>;
declare type Week = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "11" | "12" | "13" | "14" | "15" | "16" | "17" | "18";

declare const sanitizePlayerName: (name: string) => string;
declare const sanitizeNflScheduleTeamName: (name: string) => AbbreviatedNflTeam;
declare const playerTeamIsNflAbbreviation: (team: string) => team is AbbreviatedNflTeam;
declare const convertedScoringTypes: Record<SinglePosition, Partial<Record<ScoringCategory, StatKey>>>;
declare const scoringTypes: string[];
declare const getCurrentSeason: () => number;

declare type PlayerInTrade = {
    player: RosteredPlayer;
    fromTeam: string;
    toTeam: string;
};
declare type TradeStatus = "pending" | "accepted" | "rejected" | "countered";
declare type Trade = {
    id: string;
    season: number;
    teamsInvolved: string[];
    players: PlayerInTrade[];
    status: TradeStatus;
    dateProposed: number;
    counterId: string | null;
};
declare const buildTrade: (playersInvolved: Record<string, RosteredPlayer>[], teamIds: string[]) => Trade;

declare type ConnectionAction = {
    userId: string;
    userEmail: string;
    type: "connect" | "disconnect";
};
declare type ServerToClientEvents = {
    "user connection": (action: ConnectionAction) => void;
    sync: (state: DraftState) => void;
};
declare type ClientToServerEvents = {
    "join room": (room: string) => void;
    "leave room": (room: string) => void;
};
declare type InterServerEvents = {};
declare type SocketData = {
    user: DecodedIdToken;
};

export { AbbreviatedNflTeam, AbbreviationToFullTeam, ClientToServerEvents, ConnectionAction, CreateDraftRequest, CumulativePlayerScore, CumulativePlayerScores, DatabasePlayer, DraftPhase, DraftPick, DraftSettings, DraftState, DraftType, ErrorType, FantasyPerformanceByPosition, FetchPlayerScoresRequest, FinalizedLineup, FinalizedPlayer, FullCategory, FullNflTeam, GenericRequest, InterServerEvents, League, LeagueAPIResponse, LineupSettings, NflPlayer, PickOrder, PlayerInTrade, PlayerScoreData, PlayerScoresResponse, Position, PositionInfo, ProjectedPlayer, Qualifier, QuicksetLineupType, QuicksetRequest, RosteredPlayer, RunScoresResponse, ScoringCategory, ScoringError, ScoringMinimum, ScoringSetting, ScrapedADPData, ScrapedPlayerProjection, ServerToClientEvents, SinglePosition, SingleTeamResponse, SocketData, StatKey, StoredPlayerInformation, Team, TeamFantasyPositionPerformance, TeamToSchedule, TeamWeekInfo, Trade, TradeStatus, UpdateAllTeamsResponse, Week, buildTrade, convertedScoringTypes, createDraftStateForLeague, emptyDefaultPositions, getCurrentSeason, getNumPlayersFromLineupSettings, lineupToIterable, playerTeamIsNflAbbreviation, positionTypes, sanitizeNflScheduleTeamName, sanitizePlayerName, scoringTypes, setPlayerName, singlePositionTypes };
