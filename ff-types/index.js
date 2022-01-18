class League {
    constructor(name, commissioners, numWeeks, lineupSettings, logo) {
        this.name = name;
        this.commissioners = commissioners;
        this.numWeeks = numWeeks;
        this.lastScoredWeek = 0;
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

class FinalizedPlayer {
    constructor(name, position, lineup) {
        this.name = name;
        this.position = position;
        this.lineup = lineup;
    }
}
class RosteredPlayer {
    constructor(name, pos) {
        this.name = name;
        this.position = pos;
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
    constructor(name, league, ownerName, isCommissioner, numWeeks) {
        this.ownerName = ownerName;
        this.name = name;
        this.leagueName = league;
        this.isCommissioner = isCommissioner;
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

const generatePostRequest = (body) => {
    return {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
    };
};
const toJSON = (data) => data.json();
class API {
    static fetchLeague(leagueId) {
        const url = this.serverAddress + `/api/v1/league/${leagueId}/`;
        return new Promise((resolve, _) => {
            fetch(url)
                .then((data) => data.json())
                .then((json) => resolve(json));
        });
    }
    static runScores(id, week = 1, teams) {
        const url = this.serverAddress + `/api/v1/league/${id}/runScores/`;
        const reqDict = generatePostRequest({ week, teams });
        return new Promise((resolve, _) => {
            fetch(url, reqDict)
                .then(toJSON)
                .then((json) => resolve(json));
        });
    }
    static fetchPlayerScores({ leagueId, week, players, }) {
        const url = this.serverAddress + `/api/v1/league/${leagueId}/playerScores/`;
        const req = generatePostRequest({ players, week });
        return new Promise((resolve, reject) => fetch(url, req)
            .then(toJSON)
            .then((json) => resolve(json))
            .catch((err) => reject(err)));
    }
    static updateTeams(teams) {
        const url = this.serverAddress + `/api/v1/league/updateTeams/`;
        const req = generatePostRequest({ teams });
        return new Promise((resolve, _) => fetch(url, req)
            .then(toJSON)
            .then((json) => resolve(json.teams)));
    }
}
API.serverAddress = "";

var types = /*#__PURE__*/Object.freeze({
    __proto__: null
});

const sanitizePlayerName = (name) => name.replace(/\./g, "").toLowerCase();

export { API, types as ApiTypes, FinalizedPlayer, League, RosteredPlayer, ScoringError, Team, emptyDefaultPositions, lineupToIterable, positionTypes, sanitizePlayerName };
