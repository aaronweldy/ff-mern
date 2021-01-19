import React, {useState, useEffect} from 'react'
import {useParams} from 'react-router-dom'
import {useSelector} from 'react-redux'
import {selectUser} from '../Redux/userSlice.js'
import {Container, Col, Jumbotron, Button, Alert, Row} from 'react-bootstrap'
import TeamTable from './TeamTable'
import LeagueButton from './LeagueButton'

function TeamPage() {
  const {id, leagueId} = useParams();
  const [team, setTeam] = useState(null);
  const [bench, setBench] = useState([]);
  const [starters, setStarters] = useState([]);
  const [success, setSuccess] = useState(false);
  const currUser = useSelector(selectUser);
  const url = `/api/v1/league/${leagueId}/team/${id}/`;
  useEffect(() => {
    async function fetchTeam() {
      const resp = await fetch(url);
      const data = await resp.json();
      setTeam(data.team);
      setBench(data.team.players.filter(player => player.lineup === 'bench'));
      const starters = (Object.keys(data.league.lineupSettings).map(pos => {
        return [...Array(parseInt(data.league.lineupSettings[pos])).fill().map(_ => { return {"position" : pos, "name" : '', "lineup" : pos} })];
      }).flat());
      data.team.players.filter(player => player.lineup !== 'bench').forEach(starter => {
          starters[starters.findIndex(player => player.position === starter.position && player.name === '')] = starter;
      });
      setStarters(starters);
    }
    fetchTeam();
  }, [url]);
  const handlePlayerChange = (selectedPlayer, name, swapPlayer) => {
    const tempSt = [...starters];
    const tempB = [...bench];
    if (name === "starters") {
        const selectPlayer = tempSt[selectedPlayer];
        const swappedPlayer = tempB[swapPlayer];
        swappedPlayer['lineup'] = selectPlayer.lineup;
        if(selectPlayer.name !== '') {
            selectPlayer['lineup'] = 'bench';
            tempB[swapPlayer] = selectPlayer;
        }
        else {
            tempB.splice(swapPlayer, 1);
        }
        tempSt[selectedPlayer] = swappedPlayer;
    }
    else {
        const selectPlayer = tempB[selectedPlayer];
        const swappedPlayer = tempSt[swapPlayer];
        selectPlayer['lineup'] = swappedPlayer['lineup'];
        if(swappedPlayer.name !== '') {
            tempB[selectedPlayer] = swappedPlayer;
            swappedPlayer['lineup'] = 'bench';
        }
        else {
            tempB.splice(selectedPlayer, 1);
        }
        tempSt[swapPlayer] = selectPlayer;
    }
    setBench(tempB);
    setStarters(tempSt);
  };
  const handleBenchPlayer = (selectedPlayer, i) => {
      const tempB = [...bench];
      const tempSt = [...starters];
      const replacePlayer = {name: '', position: selectedPlayer.position, lineup: selectedPlayer.lineup};
      tempSt[i] = replacePlayer;
      selectedPlayer['lineup'] = 'bench';
      tempB.push(selectedPlayer);
      setBench(tempB);
      setStarters(tempSt);
  }
  const sendUpdatedTeams = _ => {
    const url = `/api/v1/league/updateTeams/`;
    const body = {teams: [team]};
    const reqdict = {
        method : 'POST', 
        headers : {'content-type' : 'application/json'},
        body : JSON.stringify(body)
    };
    fetch(url, reqdict)
    .then(data => data.json())
    .then(json => {
        console.log(json); 
        setSuccess(true);
        setTimeout(() => setSuccess(false), 8000);
    });
  }
  return(
    <Container>
        <LeagueButton id={leagueId}></LeagueButton>
        {team ? 
        <Jumbotron className="no-background">
            <h1>{team.name}</h1>
            {team.owner === currUser ? <span><a href="/">Edit Team</a></span> : <span>{team.ownerName}</span>}
        </Jumbotron>
        : ''}
        {team ? 
        <Col>
            <h3>Starters</h3>
            <TeamTable players={starters} oppPlayers={bench} name="starters" handleBenchPlayer={handleBenchPlayer} handlePlayerChange={handlePlayerChange}></TeamTable>
            <h3>Bench</h3>
            <TeamTable players={bench} oppPlayers={starters} name="bench" handleBenchPlayer={handleBenchPlayer} handlePlayerChange={handlePlayerChange}></TeamTable>
            <Button className="mb-3 mt-2" variant="success" onClick={sendUpdatedTeams}>Submit Lineup</Button>
            {success ? <Row><Col sm={3}><Alert variant="success">Submitted lineup!</Alert></Col></Row> : ''}
        </Col>
        : ''}
    </Container>);
}

export default TeamPage;