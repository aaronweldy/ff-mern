import pkg from 'mongoose';
const { Schema, model } = pkg;

const leagueSchema = Schema({
    name: {
        type: String,
        required: true
    },
    teamIds: []
})

export default model("league", leagueSchema);