import "../CSS/App.css";
import * as React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import TeamHub from "./TeamHub";
import TeamPage from "./TeamPage";
import NavHeader from "./NavHeader";
import Login from "./Login";
import LeagueHome from "./LeagueHome";
import EditRosters from "./EditRosters";
import RunScores from "./RunScores";
import ScoringSettings from "./ScoringSettings";
import AddPoints from "./AddPoints";
import AdjustLineups from "./AdjustLineups";
import User from "./User";
import SecureRoute from "./utils/SecureRoute";
import EditLeagueSettings from "./EditLeagueSettings";
import "bootstrap/dist/css/bootstrap.min.css";
import JoinLeague from "./JoinLeague";
import CreateLeague from "./CreateLeague";
import { CumulativePlayers } from "./CumulativePlayers";
import { QueryClient, QueryClientProvider } from "react-query";
import { CommissionerRoute } from "./utils/CommissionerRoute";
import { ReactQueryDevtools } from "react-query/devtools";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={true} />
      <Router>
        <NavHeader />
        <Routes>
          <Route path="/league/create/" element={<CreateLeague />} />
          <Route path="/league/join/" element={<JoinLeague />} />
          <Route path="/league" element={<SecureRoute />}>
            <Route path="/league/:leagueId/team/:id/" element={<TeamPage />} />
            <Route path="/league/:id/editTeams/" element={<EditRosters />} />
            <Route
              path="/league/:id/editScoringSettings/"
              element={
                <CommissionerRoute>
                  <ScoringSettings />
                </CommissionerRoute>
              }
            />
            <Route
              path="/league/:id/updateSettings/"
              element={<EditLeagueSettings />}
            />
            <Route path="/league/:id/runScores/" element={<RunScores />} />
            <Route path="/league/:id/addPoints/" element={<AddPoints />} />
            <Route
              path="/league/:id/adjustLineups/"
              element={<AdjustLineups />}
            />
            <Route
              path="/league/:id/cumulativePlayerScores/"
              element={<CumulativePlayers />}
            />
            <Route path="/league/:id/" element={<LeagueHome />} />
          </Route>
          <Route path="/user/:userid/" element={<User />} />
          <Route path="/login/" element={<Login />} />
          <Route path="/" element={<TeamHub />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
};
export default App;
