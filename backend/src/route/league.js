import Team  from '../model/team.js'
import League from '../model/league.js'
import WeekStats from '../model/weekStats.js'
import User from '../model/user.js'
import auth from '../middleware/auth.js'
import scraper from 'table-scraper'
import { Router } from 'express'

const router = Router();

const convertedScoringTypes = { "QB" : {"ATT" : "ATT",  "PASS YD" : "YDS", "RUSH YD" : "YDS_2", "CARRIES" : "ATT_2", "PASS TD" : "TD", "RUSH TD" : "TD_2", "YD PER ATT" : "Y/A", "CP%" : "CP%", "INT" : "INT",  "FUM" : "FL"},
    "RB" : {"REC YD" : "YDS_2",  "RUSH YD" : "YDS", "CARRIES" : "ATT", "YD PER CARRY" : "Y/A", "YD PER CATCH" : "Y/R",  "REC" : "REC",  "TARGETS" : "TGT", "RUSH TD" : "TD",  "REC TD" : "TD_2", "FUM" : "FL"},
    "WR" :  {"REC YD" : "YDS",  "RUSH YD" : "YDS_2", "CARRIES" : "ATT", "YD PER CARRY" : "Y/A", "YD PER CATCH" : "Y/R",  "REC" : "REC",  "TARGETS" : "TGT", "RUSH TD" : "TD_2",  "REC TD" : "TD", "FUM" : "FL"},
    "TE" :  {"REC YD" : "YDS",  "RUSH YD" : "YDS_2", "CARRIES" : "ATT", "YD PER CARRY" : "Y/A", "YD PER CATCH" : "Y/R",  "REC" : "REC",  "TARGETS" : "TGT", "RUSH TD" : "TD_2",  "REC TD" : "TD", "FUM" : "FL"},
    "K" : {'FG 1-19' : "1-19",   'FG 20-29' : '20-29',  'FG 30-39' : '30-39',  'FG 40-49' : '40-49',  'FG 50+' : '50+'}
}

const positions = ['qb', 'rb', 'wr', 'te', 'k'];

router.get('/:id/', async (req, res) => {
    const leagueId = req.params['id'];
    const teams = await Team.find({league: leagueId});
    const comms = await League.findById(leagueId);
    res.status(200).json({teams, commissioners: comms.commissioners, scoringSettings: comms.scoringSettings, lineupSettings: comms.lineupSettings});
});

router.post('/create/', async (req, res) => {
    const {league, teams, posInfo} = req.body;
    const newLeague = new League({name: league, lineupSettings: posInfo});
    await newLeague.save();
    let comms = [];
    for (const team of teams) {
        let uid = (await User.findOne({username: team.teamOwner}));
        if (uid) uid = uid.id;
        const newTeam = new Team({
            name: team.teamName,
            owner: uid || "default",
            ownerName: team.teamOwner || "default",
            isCommissioner: team.isCommissioner,
            league: newLeague.id,
            leagueName: newLeague.name
        });
        if(uid && team.isCommissioner) comms.push(uid);
        await newTeam.save();
    }
    await League.findByIdAndUpdate(newLeague.id, {commissioners: comms}, {useFindAndModify: false});
    res.status(200).json({"id" : newLeague.id});
});


router.get('/:leagueId/team/:id/', async (req, res) => {
    const team = await Team.findById(req.params['id']);
    const league = await League.findById(req.params['leagueId']);
    res.status(200).json({team, league});
});

router.get('/:leagueId/teams/', async (req, res) => {
    const league = req.params['leagueId'];
    const teams = await League.findById(league);
    res.status(200).json({teams});
});

router.post('/updateTeams/', async (req, res) => {
    const {teams} = req.body;
    teams.forEach(async team => {
        const owner = await User.findOne({username: team.ownerName});
        await Team.findByIdAndUpdate(team._id, {name: team.name, owner: owner ? owner._id : "default", ownerName: owner ? owner.username : "default", players: team.players}, {useFindAndModify: false});
    });
    res.status(200).send({"message": "updated teams successfully"});
});

router.post('/adjustTeamSettings/', async (req, res) => {
    const {teams} = req.body;
    for (const team of teams) {
        await Team.findByIdAndUpdate(team._id, {...team}, {useFindAndModify: false});
    }
    res.status(200).send({"message" : "updated teams successfully"});
})

router.post('/:leagueId/updateSettings/', async (req, res) => {
    const {settings} = req.body;
    const {leagueId} = req.params;
    await League.findByIdAndUpdate(leagueId, {scoringSettings: settings}, {useFindAndModify: false});
    res.status(200).send({"message": "updated settings successfully"});
});

router.post('/:leagueId/runScores/', async (req, res) => {
    const {week} = req.body;
    const {leagueId} = req.params;
    const league = await League.findById(leagueId);
    const teams = await Team.find({league: leagueId});
    let statsAtt = await WeekStats.findOne({week});
    if (!statsAtt) {
        const playerMap = {}
        for await (const pos of positions) {
            const url = `https://www.fantasypros.com/nfl/stats/${pos}.php?year=${new Date().getFullYear}&week=${week}&range=week`;
            const table = await scraper.get(url);
            for (const player of table[0]) {
                const hashedName = player['Player'].replace(/\./g, '');
                playerMap[hashedName.slice(0, hashedName.indexOf('(') - 1)] = pos === 'QB' ? 
                {...player, "CP%" : Number.parseFloat(player['CMP']) / Number.parseFloat(player['ATT']), "Y/A" : Number.parseFloat(player['YDS']) / Number.parseFloat(player['ATT'])} 
                : player;
            }
        }
        const stats = new WeekStats({week, playerMap})
        await stats.save();
        statsAtt = stats;
    }
    for await (const team of teams) {
        team.players.filter(player => player.lineup !== 'bench').forEach(player => {
            const catPoints = league.scoringSettings.filter(set => set.position.indexOf(player.position) >= 0).map(category => {
                const cat = category['category'];
                let points = 0;
                const statNumber = Number.parseFloat(statsAtt.playerMap[player.name][convertedScoringTypes[player.position][cat.statType]]);
                switch (cat.qualifier) {
                    case "per":
                        console.log(`stat: ${statNumber}, thresh: ${cat.threshold}`)
                        points = (statNumber / Number.parseFloat(cat.threshold)) * Number.parseFloat(category.points);
                        break;
                    case "greater than":
                        console.log(`stat: ${statNumber}, thresh: ${cat.threshold}`)
                        if (statNumber > Number.parseFloat(cat.threshold)) points = Number.parseFloat(category.points);
                        break;
                    case "between":
                        if (statNumber >= cat.threshold_1 && statNumber <= cat.threshold_2) points =  Number.parseFloat(category.points);
                        break;
                }
                const successMins = category.minimums.filter(min => {
                    const statNumber = Number.parseFloat(statsAtt.playerMap[player.name][convertedScoringTypes[player.position][min.statType]]);
                    return statNumber > Number.parseFloat(min.threshold);
                });
                const retObj = {};
                const hashVal = cat.qualifier === 'between' ? `${cat.qualifier}|${cat.threshold_1}${cat.threshold_2}|${cat.statType}` : `${cat.qualifier}|${cat.threshold}|${cat.statType}`;
                retObj[hashVal] =  successMins.length === category.minimums.length ? points : 0;
                return  retObj;
            });
            player.weekStats[week] = Object.assign({}, ...catPoints);
            player.points[week] = Number.parseFloat(catPoints.reduce(((acc, i) => acc + Object.values(i)[0]), 0).toPrecision(4));
        });
        console.log(team.players);
        const weekScore = team.players.reduce(((acc, player) => player.points[week] ? acc + player.points[week] : acc), 0);
        team.weekScores[week] = weekScore;
        await Team.findByIdAndUpdate(team._id, {...team}, {useFindAndModify: false});
    }
    res.status(200).json({teams});
});

export default router;