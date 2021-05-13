import '../CSS/App.css';
import TeamHub from './TeamHub'
import TeamPage from './TeamPage'
import MainNav from './Navbar'
import Login from './Login'
import CreateLeague from './CreateLeague'
import LeagueHome from './LeagueHome'
import EditTeams from './EditTeams'
import RunScores from './RunScores'
import ScoringSettings from './ScoringSettings'
import AddPoints from './AddPoints'
import AdjustLineups from './AdjustLineups'
import User from './User'
import SecureRoute from './SecureRoute'
import React from 'react'
import { BrowserRouter as Router, Route, Switch} from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const App = () => {
  return (
    <Router>
      <MainNav></MainNav>
      <Switch>
        <Route path="/league/create/" component={CreateLeague}></Route>
        <SecureRoute path="/league/:leagueId/team/:id/" component={TeamPage}></SecureRoute>
        <Route path="/league/:id/editTeams/" component={EditTeams}></Route>
        <Route path="/league/:id/editSettings/" component={ScoringSettings}></Route>
        <Route path="/league/:id/runScores/" component={RunScores}></Route>
        <Route path="/league/:id/addPoints/" component={AddPoints}></Route>
        <Route path="/league/:id/adjustLineups/" component={AdjustLineups}></Route>
        <SecureRoute path="/league/:id/" component={LeagueHome}></SecureRoute>
        <SecureRoute path="/user/:userid/" component={User}></SecureRoute>
        <Route path="/login/" component={Login}></Route>
        <SecureRoute path="/" component={TeamHub}></SecureRoute>
      </Switch>
    </Router>
  );
}

export default App;
