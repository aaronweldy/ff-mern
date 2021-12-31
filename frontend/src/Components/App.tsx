import "../CSS/App.css";
import * as React from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import TeamHub from "./TeamHub";
import TeamPage from "./TeamPage";
import MainNav from "./Navbar";
import Login from "./Login";
import LeagueHome from "./LeagueHome";
import EditTeams from "./EditTeams";
import RunScores from "./RunScores";
import ScoringSettings from "./ScoringSettings";
import AddPoints from "./AddPoints";
import AdjustLineups from "./AdjustLineups";
import User from "./User";
import SecureRoute from "./SecureRoute";
import EditLeagueSettings from "./EditLeagueSettings";
import "bootstrap/dist/css/bootstrap.min.css";
import JoinLeague from "./JoinLeague";
import CreateLeague from "./CreateLeague";

const App = () => {
  return (
    <Router>
      <MainNav />
      <Switch>
        <Route path="/league/create/" component={CreateLeague} />
        <Route path="/league/join/" component={JoinLeague} />
        <SecureRoute path="/league/:leagueId/team/:id/" component={TeamPage} />
        <Route path="/league/:id/editTeams/" component={EditTeams} />
        <Route
          path="/league/:id/editScoringSettings/"
          component={ScoringSettings}
        />
        <SecureRoute
          path="/league/:id/updateSettings/"
          component={EditLeagueSettings}
        />
        <Route path="/league/:id/runScores/" component={RunScores} />
        <Route path="/league/:id/addPoints/" component={AddPoints} />
        <Route path="/league/:id/adjustLineups/" component={AdjustLineups} />
        <SecureRoute path="/league/:id/" component={LeagueHome} />
        <SecureRoute path="/user/:userid/" component={User} />
        <Route path="/login/" component={Login} />
        <SecureRoute path="/" component={TeamHub} />
      </Switch>
    </Router>
  );
};
export default App;
