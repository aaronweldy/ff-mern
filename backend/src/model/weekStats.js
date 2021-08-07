import pkg from "mongoose";
const { Schema, model } = pkg;

const WeekStats = Schema({
  week: {
    type: String,
    required: true,
  },
  playerMap: {},
});

export default model("WeekStats", WeekStats);
