import '../App.css';
import TeamHub from './TeamHub'
import TeamPage from './TeamPage'
import MainNav from './Navbar'
import CreateAccount from './CreateAccount'
import Login from './Login'
import CreateLeague from './CreateLeague'
import LeagueHome from './LeagueHome'
import React from 'react'
import { BrowserRouter as Router, Route, Switch} from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const App = () => {
  return (
    <Router>
      <MainNav></MainNav>
      <Switch>
        <Route path="/league/create/" component={CreateLeague}></Route>
        <Route path="/league/:id/" component={LeagueHome}></Route>
        <Route path="/team/" component={TeamPage}></Route>
        <Route path="/create/" component={CreateAccount}></Route>
        <Route path="/login/" component={Login}></Route>
        <Route path="/" component={TeamHub}></Route>
      </Switch>
    </Router>
  );
}

export default App;
