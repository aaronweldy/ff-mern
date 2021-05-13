import { Router } from "express";
import Team  from '../model/team.js'
import env from 'dotenv';
import admin from 'firebase-admin'
import firebase from 'firebase'
const router = Router();
admin.initializeApp( {credential: admin.credential.applicationDefault()});
firebase.initializeApp({
  apiKey: "AIzaSyCXG6J4qNGuYc4P2RZM_wKAEdECO7_qaog",
  authDomain: "ff-mern.firebaseapp.com",
  projectId: "ff-mern",
  storageBucket: "ff-mern.appspot.com",
  messagingSenderId: "54859804653",
  appId: "1:54859804653:web:7ca0c44cce579e08da01e4",
  measurementId: "G-CKLBF5P572"
});


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