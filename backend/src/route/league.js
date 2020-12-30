import Team  from '../model/team.js'
import League from '../model/league.js'
import User from '../model/user.js'
import { Router } from 'express'

const router = Router();


router.get('/:id/', async (req, res) => {
    const leagueId = req.params['id'];
    const teams = await Team.find({league: leagueId});
    res.status(200).json({teams});
});

router.post('/create/', async (req, res) => {
    const {league, teams} = req.body;
    const newLeague = new League({name: league});
    await newLeague.save();
    teams.forEach(async team => {
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
        console.log(newTeam);
        await newTeam.save();
    });
    res.status(200).json({"message" : "Successfully created new teams."});
});

export default router;