import pkg from 'mongoose';
const { Schema, model } = pkg;

const leagueSchema = Schema({
    name: {
        type: String,
        required: true
    }
})

export default model("league", leagueSchema);