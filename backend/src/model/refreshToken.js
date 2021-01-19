import pkg from 'mongoose';
const { Schema, model } = pkg;

const RefreshToken = Schema({
    refreshToken: {
        type: String,
        required: true
    },
    token: {
        type: String,
        required: true
    }
})

export default model("RefreshToken", RefreshToken);