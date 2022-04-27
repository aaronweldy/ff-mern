class League {
    constructor(name, commissioners, numWeeks, lineupSettings, logo) {
        this.name = name;
        this.commissioners = commissioners;
        this.numWeeks = numWeeks;
        this.lastScoredWeek = 0;
        this.numSuperflex = 0;
        this.lineupSettings = lineupSettings;
        this.logo = logo;
    }
}

class ScoringError {
    constructor(type, desc, player, team) {
        this.type = type;
        this.desc = desc;
        this.player = player;
        this.team = team;
    }
}

const sanitizePlayerName = (name) => name.replace(/\./g, "").toLowerCase();
const sanitizeNflScheduleTeamName = (name) => {
    return name
        .replace(/\@/g, "")
        .replace("JAC", "JAX")
        .replace("WAS", "WSH");
};
const playerTeamIsNflAbbreviation = (team) => {
    return (team === "ARI" ||
        team === "ATL" ||
        team === "BAL" ||
        team === "BUF" ||
        team === "CAR" ||
        team === "CHI" ||
        team === "CIN" ||
        team === "CLE" ||
        team === "DAL" ||
        team === "DEN" ||
        team === "DET" ||
        team === "GB" ||
        team === "HOU" ||
        team === "IND" ||
        team === "JAX" ||
        team === "JAC" ||
        team === "KC" ||
        team === "LAC" ||
        team === "LAR" ||
        team === "MIA" ||
        team === "MIN" ||
        team === "NE" ||
        team === "NO" ||
        team === "NYG" ||
        team === "NYJ" ||
        team === "LV" ||
        team === "PHI" ||
        team === "PIT" ||
        team === "SEA" ||
        team === "SF" ||
        team === "TB" ||
        team === "TEN" ||
        team === "WAS" ||
        team === "WSH");
};
const convertedScoringTypes = {
    QB: {
        ATT: "ATT",
        CMP: "CMP",
        "PASS YD": "YDS",
        "RUSH YD": "YDS_2",
        "YD PER COMPLETION": "Y/CMP",
        CARRIES: "ATT_2",
        "PASS TD": "TD",
        "RUSH TD": "TD_2",
        "YD PER ATT": "Y/A",
        "CP%": "PCT",
        INT: "INT",
        FUM: "FL",
    },
    RB: {
        "REC YD": "YDS_2",
        "RUSH YD": "YDS",
        CARRIES: "ATT",
        "YD PER CARRY": "Y/A",
        "YD PER CATCH": "Y/R",
        REC: "REC",
        TARGETS: "TGT",
        "RUSH TD": "TD",
        "REC TD": "TD_2",
        FUM: "FL",
    },
    WR: {
        "REC YD": "YDS",
        "RUSH YD": "YDS_2",
        CARRIES: "ATT",
        "YD PER CARRY": "Y/A",
        "YD PER CATCH": "Y/R",
        REC: "REC",
        TARGETS: "TGT",
        "RUSH TD": "TD_2",
        "REC TD": "TD",
        FUM: "FL",
    },
    TE: {
        "REC YD": "YDS",
        "RUSH YD": "YDS_2",
        CARRIES: "ATT",
        "YD PER CARRY": "Y/A",
        "YD PER CATCH": "Y/R",
        REC: "REC",
        TARGETS: "TGT",
        "RUSH TD": "TD_2",
        "REC TD": "TD",
        FUM: "FL",
    },
    K: {
        "FG 1-19": "1-19",
        "FG 20-29": "20-29",
        "FG 30-39": "30-39",
        "FG 40-49": "40-49",
        "FG 50+": "50+",
        XPT: "XPT",
    },
};
const scoringTypes = [
    "PASS YD",
    "CMP",
    "ATT",
    "CP%",
    "PASS TD",
    "INT",
    "YD PER ATT",
    "YD PER COMPLETION",
    "CARRIES",
    "RUSH YD",
    "YD PER CARRY",
    "FUM",
    "RUSH TD",
    "TARGETS",
    "REC",
    "REC YD",
    "REC TD",
    "YD PER CATCH",
    "XPT",
    "FG 1-19",
    "FG 20-29",
    "FG 30-39",
    "FG 40-49",
    "FG 50+",
    "FG/XP MISS",
];

const setPlayerName = (player, name) => {
    player.fullName = name;
    player.sanitizedName = sanitizePlayerName(name);
};
class FinalizedPlayer {
    constructor(name, position, team, lineup) {
        this.fullName = name;
        this.sanitizedName = sanitizePlayerName(name);
        this.position = position;
        this.lineup = lineup;
        this.team = team;
    }
}
class RosteredPlayer {
    constructor(name, team, pos) {
        this.fullName = name;
        this.sanitizedName = sanitizePlayerName(name);
        this.position = pos;
        this.team = team;
    }
}
const positionTypes = [
    "QB",
    "RB",
    "WR",
    "TE",
    "K",
    "WR/RB",
    "WR/RB/TE",
    "QB/WR/RB/TE",
];
const emptyDefaultPositions = positionTypes.reduce((map, pos) => {
    map[pos] = 0;
    return map;
}, {});

class Team {
    constructor(name, leagueName, ownerName, isCommissioner, numWeeks) {
        this.name = name;
        this.leagueName = leagueName;
        this.ownerName = ownerName;
        this.isCommissioner = isCommissioner;
        this.lastUpdated = "";
        this.rosteredPlayers = [];
        this.logo = "/football.jfif";
        this.weekInfo = [
            ...Array(numWeeks + 1).fill({
                weekScore: 0,
                addedPoints: 0,
                finalizedLineup: {},
            }),
        ];
    }
    static updateNumWeeks(team, numWeeks) {
        const newWeekInfo = [
            ...Array(numWeeks + 1).fill({
                weekScore: 0,
                addedPoints: 0,
                finalizedLineup: {},
            }),
        ];
        team.weekInfo.forEach((info, i) => {
            if (i <= numWeeks) {
                newWeekInfo[i] = info;
            }
        });
        team.weekInfo = newWeekInfo;
    }
    static sumWeekScore(team, week) {
        if (week >= team.weekInfo.length) {
            return 0;
        }
        return team.weekInfo[week].addedPoints + team.weekInfo[week].weekScore;
    }
}
const lineupToIterable = (lineup) => {
    return Object.keys(lineup).reduce((acc, pos) => {
        lineup[pos].forEach((player) => {
            acc.push(player);
        });
        return acc;
    }, []);
};

const AbbreviationToFullTeam = {
    ARI: "arizona cardinals",
    ATL: "atlanta falcons",
    BAL: "baltimore ravens",
    BUF: "buffalo bills",
    CAR: "carolina panthers",
    CHI: "chicago bears",
    CIN: "cincinnati bengals",
    CLE: "cleveland browns",
    DAL: "dallas cowboys",
    DEN: "denver broncos",
    DET: "detroit lions",
    GB: "green bay packers",
    HOU: "houston texans",
    IND: "indianapolis colts",
    JAC: "jacksonville jaguars",
    JAX: "jacksonville jaguars",
    KC: "kansas city chiefs",
    LAC: "los angeles chargers",
    LAR: "los angeles rams",
    LV: "las vegas raiders",
    MIA: "miami dolphins",
    MIN: "minnesota vikings",
    NE: "new england patriots",
    NO: "new orleans saints",
    NYG: "new york giants",
    NYJ: "new york jets",
    PHI: "philadelphia eagles",
    PIT: "pittsburgh steelers",
    SEA: "seattle seahawks",
    SF: "san francisco 49ers",
    TB: "tampa bay buccaneers",
    TEN: "tennessee titans",
    WAS: "washington commanders",
    WSH: "washington commanders",
};

export { AbbreviationToFullTeam, FinalizedPlayer, League, RosteredPlayer, ScoringError, Team, convertedScoringTypes, emptyDefaultPositions, lineupToIterable, playerTeamIsNflAbbreviation, positionTypes, sanitizeNflScheduleTeamName, sanitizePlayerName, scoringTypes, setPlayerName };
