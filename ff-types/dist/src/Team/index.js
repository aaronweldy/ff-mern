import { lineupOrder } from "../Utils";
export class Team {
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
export const lineupToIterable = (lineup) => {
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
export const mapTeamsToIds = (teams) => {
    return teams.reduce((acc, team) => {
        acc[team.id] = team;
        return acc;
    }, {});
};
//# sourceMappingURL=index.js.map