import '../CSS/App.css';
import TeamHub from './TeamHub'
import TeamPage from './TeamPage'
import MainNav from './Navbar'
import CreateAccount from './CreateAccount'
import Login from './Login'
import CreateLeague from './CreateLeague'
import LeagueHome from './LeagueHome'
import EditTeams from './EditTeams'
import RunScores from './RunScores'
import ScoringSettings from './ScoringSettings'
import AddPoints from './AddPoints'
import AdjustLineups from './AdjustLineups'
import React from 'react'
import { BrowserRouter as Router, Route, Switch} from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const App = () => {
  return (
    <Router>
      <MainNav></MainNav>
      <Switch>
        <Route path="/league/create/" component={CreateLeague}></Route>
        <Route path="/league/:leagueId/team/:id/" component={TeamPage}></Route>
        <Route path="/league/:id/editTeams/" component={EditTeams}></Route>
        <Route path="/league/:id/editSettings/" component={ScoringSettings}></Route>
        <Route path="/league/:id/runScores/" component={RunScores}></Route>
        <Route path="/league/:id/addPoints/" component={AddPoints}></Route>
        <Route path="/league/:id/adjustLineups/" component={AdjustLineups}></Route>
        <Route path="/league/:id/" component={LeagueHome}></Route>
        <Route path="/create/" component={CreateAccount}></Route>
        <Route path="/login/" component={Login}></Route>
        <Route path="/" component={TeamHub}></Route>
      </Switch>
    </Router>
  );
}

export default App;
