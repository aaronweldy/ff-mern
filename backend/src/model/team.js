import pkg from 'mongoose';
import env from 'dotenv';
const { Schema, model } = pkg;

env.config();

const teamSchema = Schema({
    name: {
        type: String,
        required: true
    },
    owner: {
        type: String,
        required: true
    },
    ownerName: {
        type: String,
        required: true
    },
    logo: {
        type: String,
        default: `http://${process.env.FRONTEND_URI}/football.jfif`
    },
    league: {
        type: String,
        required: true
    },
    leagueName: {
        type: String,
        required: true
    },
    isCommissioner: {
        type: Boolean,
        default: false
    },
    players: [],
    weekScores: [],
    addedPoints: [...Array(17)].fill(0)
})

export default model("team", teamSchema);