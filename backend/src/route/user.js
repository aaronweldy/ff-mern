import { Router } from "express";
import Team  from '../model/team.js'
import env from 'dotenv';
import admin from '../config/firebase-config.js'
import firebase from 'firebase'
const router = Router();


env.config();

router.get('/:id/leagues/', async (req, res) => {
    const teams = [];
    const {id} = req.params;
    for await (const team of Team.find({owner: id})) {
        teams.push(team);
    }
    res.json({teams});
});

export default router;