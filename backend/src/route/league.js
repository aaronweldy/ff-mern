import Team  from '../model/team.js'
import League from '../model/league.js'
import WeekStats from '../model/weekStats.js'
import scraper from 'table-scraper'
import {convertedScoringTypes, defaultScoringSettings} from "../constants/league.js"
import { Router } from 'express'
import admin from '../config/firebase-config.js'

const router = Router();

const positions = ['qb', 'rb', 'wr', 'te', 'k'];

router.get('/:id/', async (req, res) => {
    const leagueId = req.params['id'];
    try {
        const teams = await Team.find({league: leagueId});
        const league = await League.findById(leagueId);
        res.status(200).json({league, teams});
    } catch (e) {
        console.log(e);
        res.status(500).send();
    }
});

router.post('/create/', async (req, res) => {
    const {league, teams, logo, posInfo, scoring} = req.body;
    const newLeague = new League({name: league, lineupSettings: posInfo, logo});
    await newLeague.save();
    let comms = [];
    for await (const team of teams) {
        await admin.auth().getUserByEmail(team.teamOwner).then(async (user) => {
            const newTeam = new Team({
                name: team.teamName,
                owner: user.uid,
                ownerName: user.email,
                isCommissioner: team.isCommissioner || comms.includes(user.uid),
                league: newLeague.id,
                leagueName: newLeague.name,
                leagueLogo: logo
            });
            if(team.isCommissioner) comms.push(user.uid);
            await newTeam.save();
        }).catch(async (err) => {
            const newTeam = new Team({
                name: team.teamName,
                owner: "default",
                ownerName: "default",
                isCommissioner: team.isCommissioner || comms.includes(user.uid),
                league: newLeague.id,
                leagueName: newLeague.name,
                leagueLogo: logo
            });
            await newTeam.save();
        });
        
    }
    await League.findByIdAndUpdate(newLeague.id, {commissioners: comms, scoringSettings : scoring === "Custom" ? {} : defaultScoringSettings[scoring]}, {useFindAndModify: false});
    console.log(comms);
    res.status(200).json({"id" : newLeague.id});
});

router.post('/:id/delete/', async (req, res) => {
    const {id} = req.params;
    const {user} = req.body;
    const leagueToDelete = await League.findById(id);
    if (!leagueToDelete.commissioners.includes(user)) return res.status(403).send("User is not a commissioner, and is therefore unauthorized to delete this league.");
    await Team.deleteMany({league: id});
    await leagueToDelete.delete();
    return res.status(200).send({"message" : "League deleted successfully"});
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
        console.log(team);
        await admin.auth().getUserByEmail(team.ownerName).then(async (user) => {
            await Team.findByIdAndUpdate(team._id, {name: team.name, owner: user.uid, ownerName: team.ownerName, players: team.players}, {useFindAndModify: false});
        }).catch(async _ => {
            await Team.findByIdAndUpdate(team._id, {name: team.name, owner: "default", ownerName: "default", players: team.players}, {useFindAndModify: false});
        });
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
                const hashedName = player['Player'].replace(/\./g, '').toLowerCase();
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
        team.weekScores[week] = 0;
        team.players.filter(player => player.lineup[week] !== 'bench').forEach(player => {
            const catPoints = league.scoringSettings.filter(set => set.position.indexOf(player.position) >= 0).map(category => {
                player.error = false;
                const cat = category['category'];
                const hashVal = cat.qualifier === 'between' ? `${cat.qualifier}|${cat.threshold_1}${cat.threshold_2}|${cat.statType}` : `${cat.qualifier}|${cat.threshold}|${cat.statType}`;
                if (!Object.keys(statsAtt.playerMap).includes(player.name.toLowerCase())) {
                    player["error"] = true;
                    return {hashVal : 0};
                }
                let points = 0;
                try {
                    const statNumber = Number.parseFloat(statsAtt.playerMap[player.name.toLowerCase()][convertedScoringTypes[player.position][cat.statType]]);
                    if (isNaN(statNumber)) return {hashVal : 0};
                    console.log(statNumber);
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
                    retObj[hashVal] =  successMins.length === category.minimums.length ? points : 0;
                    return retObj;
                } catch(error) {
                    console.log(`Error finding stats for player ${player.name}, ${player.lineup[week]}`);
                    return {hashVal : 0};
                }
            });
            player.weekStats[week] = Object.assign({}, ...catPoints);
            player.points[week] = Number.parseFloat(catPoints.reduce(((acc, i) => acc + Object.values(i)[0]), 0).toPrecision(4));
        });
        console.log(team.players);
        const weekScore = team.players.filter(player => player.lineup[week] !== 'bench').reduce(((acc, player) => player.points[week] ? acc + player.points[week] : acc), 0);
        team.weekScores[week] = weekScore;
        await Team.findByIdAndUpdate(team._id, {...team}, {useFindAndModify: false});
    }
    res.status(200).json({teams});
});

export default router;