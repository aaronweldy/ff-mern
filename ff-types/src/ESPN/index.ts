export type ESPNTeam = {
    id: string;
    displayName: string;
}

export type ESPNCompetitor = {
    id: string;
    homeAway: 'home' | 'away';
    team: ESPNTeam;
}

export type ESPNCompetition = {
    id: string;
    competitors: ESPNCompetitor[];
}

export type ESPNEvent = {
    id: string;
    date: string;
    name: string;
    competitions: ESPNCompetition[];
}

export type ESPNResponse = {
    events: ESPNEvent[];
    week: {
        number: number;
    };
}

export type GameSchedule = {
    opponent: string;
    isHome: boolean;
    gameTime: string;
}

export type TeamSchedule = {
    [week: string]: GameSchedule;
}

export type NFLSchedule = {
    [team: string]: TeamSchedule;
}