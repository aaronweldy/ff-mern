import { v4 } from 'uuid';

const getNumPlayersFromLineupSettings = (settings) => {
    return Object.values(settings).reduce((acc, num) => acc + num, 0);
};
const getEmptyLineupFromSettings = (settings, format) => {
    const lineup = Object.keys(settings).reduce((acc, pos) => {
        acc[pos] = new Array(settings[pos]).fill(format.createEmptyPlayer());
        return acc;
    }, {});
    lineup["bench"] = [];
    return lineup;
};
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
        "YD PER CARRY": "Y/A_2",
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
const getCurrentSeason = () => {
    const curDate = new Date();
    const curYear = curDate.getFullYear();
    const curMonth = curDate.getMonth();
    if (curMonth < 8) {
        return curYear - 1;
    }
    return curYear;
};
const lineupOrder = {
    QB: 1,
    RB: 2,
    WR: 3,
    TE: 4,
    K: 5,
    "WR/RB": 6,
    "WR/RB/TE": 7,
    "QB/WR/RB/TE": 8,
    bench: 9,
};
const lineupSorter = (a, b) => {
    return lineupOrder[a] - lineupOrder[b];
};

const setPlayerName = (player, name) => {
    player.fullName = name;
    player.sanitizedName = sanitizePlayerName(name);
};
const createEmptyPlayer = () => ({
    fullName: "",
    sanitizedName: "",
    position: "QB",
    team: "None",
});
class FinalizedPlayer {
    constructor(name, position, team, lineup) {
        this.createEmptyPlayer = () => {
            return new FinalizedPlayer("", "QB", "None", "bench");
        };
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
RosteredPlayer.createEmptyPlayer = () => {
    return new FinalizedPlayer("", "QB", "None", "bench");
};
class ProjectedPlayer {
}
ProjectedPlayer.createEmptyPlayer = () => ({
    fullName: "",
    sanitizedName: "",
    position: "QB",
    team: "None",
    byeWeek: "1",
    positionRank: "",
    overall: 500,
    average: 500,
});
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
const singlePositionTypes = [
    "QB",
    "RB",
    "WR",
    "TE",
    "K",
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
    static generateSimplifiedInfo(team) {
        return {
            owner: team.owner,
            ownerName: team.ownerName,
            name: team.name,
            id: team.id,
        };
    }
}
const lineupToIterable = (lineup) => {
    return Object.keys(lineup)
        .reduce((acc, pos) => {
        lineup[pos].forEach((player) => {
            const itPlayer = Object.assign(Object.assign({}, player), { lineup: pos });
            acc.push(itPlayer);
        });
        return acc;
    }, [])
        .sort((a, b) => lineupOrder[a.lineup] - lineupOrder[b.lineup]);
};
const mapTeamsToIds = (teams) => {
    return teams.reduce((acc, team) => {
        acc[team.id] = team;
        return acc;
    }, {});
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

const buildTrade = (playersInvolved, teamIds) => {
    const players = [];
    playersInvolved.forEach((group, index) => {
        Object.values(group).forEach((player) => {
            players.push({
                player,
                fromTeam: teamIds[index],
                toTeam: teamIds[(index + 1) % 2],
            });
        });
    });
    return {
        id: v4(),
        season: getCurrentSeason(),
        teamsInvolved: teamIds,
        players,
        status: "pending",
        dateProposed: Date.now(),
        counterId: null,
    };
};

const getCurrentPickInfo = (state, specificPick) => {
    const { settings, currentPick } = state;
    if (specificPick === undefined) {
        specificPick = currentPick;
    }
    const round = Math.floor(specificPick / settings.draftOrder.length);
    const pickInRound = specificPick % settings.draftOrder.length;
    return {
        round,
        pickInRound,
    };
};
const createPickOrderWithTeams = (settings, teamsMap) => {
    const { draftOrder, pickOrder, numRounds } = settings;
    const reversedDraftOrder = draftOrder.slice().reverse();
    const numPicks = numRounds * draftOrder.length;
    const picks = {};
    let expandedPickOrder = [];
    for (let i = 0; i < numRounds; ++i) {
        picks[i] = new Array(draftOrder.length).fill(null);
        if (pickOrder === "snake" && i % 2 === 1) {
            expandedPickOrder.push(reversedDraftOrder.slice());
        }
        else {
            expandedPickOrder.push(draftOrder.slice());
        }
    }
    let curPick = 0;
    let curRound = 0;
    while (curPick < numPicks) {
        const pickInd = curRound === 0 ? curPick : curPick % draftOrder.length;
        const team = teamsMap[expandedPickOrder[curRound][pickInd]];
        picks[curRound][pickInd] = {
            pick: curPick,
            selectedBy: {
                owner: team.owner,
                ownerName: team.ownerName,
                name: team.name,
                id: team.id,
            },
            player: null,
        };
        curPick++;
        if (curPick % draftOrder.length === 0) {
            curRound++;
        }
    }
    return picks;
};
const createDraftStateForLeague = (lineupSettings, leagueId, teams, availablePlayers, draftId, settings = null) => {
    if (!settings) {
        settings = {
            type: "official",
            draftId,
            numRounds: getNumPlayersFromLineupSettings(lineupSettings),
            pickOrder: "snake",
            draftOrder: teams.map((team) => team.id),
        };
    }
    return {
        settings,
        leagueId: leagueId,
        currentPick: 0,
        phase: "predraft",
        availablePlayers,
        selections: createPickOrderWithTeams(settings, mapTeamsToIds(teams)),
    };
};

export { AbbreviationToFullTeam, FinalizedPlayer, League, ProjectedPlayer, RosteredPlayer, ScoringError, Team, buildTrade, convertedScoringTypes, createDraftStateForLeague, createEmptyPlayer, emptyDefaultPositions, getCurrentPickInfo, getCurrentSeason, getEmptyLineupFromSettings, getNumPlayersFromLineupSettings, lineupOrder, lineupSorter, lineupToIterable, mapTeamsToIds, playerTeamIsNflAbbreviation, positionTypes, sanitizeNflScheduleTeamName, sanitizePlayerName, scoringTypes, setPlayerName, singlePositionTypes };
