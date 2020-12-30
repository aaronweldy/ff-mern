import pkg from 'mongoose';
const { Schema, model } = pkg;

const teamSchema = Schema({
    name: {
        type: String,
        required: true
    },
    owner: {
        type: String,
        required: true
    },
    logo: {
        type: String,
        default: './football.jfif'
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
    }
})

export default model("team", teamSchema);