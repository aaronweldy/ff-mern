const cors = require("cors");
const express = require("express");
const user = require("./src/route/user.ts");
const league = require("./src/route/league.ts");
const env = require("dotenv");
const functions = require("firebase-functions");

const app = express();
env.config();

// env variables
const PORT = process.env.PORT || 3001;

app.use(express.json(), cors());

app.get("/", (req, res) => {
  console.log("receiving message");
  res.json({
    message: "API working",
  });
});

app.use("/api/v1/user/", user);
app.use("/api/v1/league/", league);

app.all("*", (request, response) => {
  console.log("Returning a 404 from the catch-all route");
  return response.sendStatus(404);
});

exports.start = () => {
  app.listen(PORT, () => {
    console.log(`Listening on port: ${PORT}`);
  });
};

exports.stop = () => {
  app.close(PORT, () => {
    console.log(`Shut down on port: ${PORT}`);
  });
};

exports.app = functions.https.onRequest(app);
