export const getNumPlayersFromLineupSettings = (settings) => {
    return Object.values(settings).reduce((acc, num) => acc + num, 0);
};
export const getEmptyLineupFromSettings = (settings, format) => {
    const lineup = Object.keys(settings).reduce((acc, pos) => {
        acc[pos] = new Array(settings[pos]).fill(format.createEmptyPlayer());
        return acc;
    }, {});
    lineup["bench"] = [];
    return lineup;
};
export class League {
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
//# sourceMappingURL=index.js.map