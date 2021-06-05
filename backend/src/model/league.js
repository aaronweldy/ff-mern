import pkg from "mongoose";
const { Schema, model } = pkg;

const leagueSchema = Schema({
  name: {
    type: String,
    required: true,
  },
  logo: {
    type: String,
    required: true,
  },
  commissioners: [],
  lineupSettings: {},
  scoringSettings: [],
});

export default model("league", leagueSchema);
