import React, {useState, useEffect} from 'react'
import {useParams} from 'react-router-dom'
import {useSelector} from 'react-redux'
import {selectUser} from '../Redux/userSlice.js'
import {Container, Col, Button, Alert, Row, Form} from 'react-bootstrap'
import TeamTable from './TeamTable'
import LeagueButton from './LeagueButton'

function TeamPage() {
  const {id, leagueId} = useParams();
  const [team, setTeam] = useState(null);
  const [bench, setBench] = useState([]);
  const [starters, setStarters] = useState([]);
  const [success, setSuccess] = useState(false);
  const [week, setWeek] = useState(1);
  const currUser = useSelector(selectUser);
  const url = `/api/v1/league/${leagueId}/team/${id}/`;
  useEffect(() => {
    async function fetchTeam() {
      const resp = await fetch(url);
      const data = await resp.json();
      setTeam(data.team);
      setBench(data.team.players.filter(player => player.lineup[week] === 'bench'));
      const starters = (Object.keys(data.league.lineupSettings).map(pos => {
        return [...Array(parseInt(data.league.lineupSettings[pos])).fill().map(_ => { return {"position" : pos, "name" : '', "lineup" : [...Array(17).fill(pos)]} })];
      }).flat());
      data.team.players.filter(player => player.lineup[week] !== 'bench').forEach(starter => {
          starters[starters.findIndex(player => player.position === starter.position && player.name === '')] = starter;
      });
      setStarters(starters);
    }
    fetchTeam();
  }, [url, week]);
  const handlePlayerChange = (selectedPlayer, name, swapPlayer) => {
    const tempSt = [...starters];
    const tempB = [...bench];
    if (name === "starters") {
        const selectPlayer = tempSt[selectedPlayer];
        const swappedPlayer = tempB[swapPlayer];
        swappedPlayer['lineup'][week] = selectPlayer.lineup[week];
        if(selectPlayer.name !== '') {
            selectPlayer['lineup'][week] = 'bench';
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
        selectPlayer['lineup'][week] = swappedPlayer['lineup'][week];
        if(swappedPlayer.name !== '') {
            tempB[selectedPlayer] = swappedPlayer;
            swappedPlayer['lineup'][week] = 'bench';
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
      const replacePlayer = {name: '', position: selectedPlayer.position, lineup: [...Array(17).fill(selectedPlayer.lineup[week])]};
      tempSt[i] = replacePlayer;
      selectedPlayer['lineup'][week] = 'bench';
      tempB.push(selectedPlayer);
      setBench(tempB);
      setStarters(tempSt);
  }
  const sendUpdatedTeams = _ => {
    const url = `/api/v1/league/updateTeams/`;
    const body = {teams: [team], week};
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
        <Col>
            <h1 className="mt-5">
                {team.name}
                <div className="subtitle mb-5 mt-2">{team.owner === currUser ? <a href="/">Edit Team</a> : team.ownerName}</div>
            </h1>
            <Form.Label>Week:</Form.Label>
            <Form.Control as="select" defaultValue={week} onChange={e => setWeek(e.target.value)}>
                {[...Array(17)].map((_, i) => {
                    return <option value={i+1} key={i}>{i+1}</option>;
                })}
            </Form.Control>
            <h3>Starters</h3>
            <TeamTable players={starters} oppPlayers={bench} week={week} name="starters" handleBenchPlayer={handleBenchPlayer} handlePlayerChange={handlePlayerChange}></TeamTable>
            <h3>Bench</h3>
            <TeamTable players={bench} oppPlayers={starters} week={week} name="bench" handleBenchPlayer={handleBenchPlayer} handlePlayerChange={handlePlayerChange}></TeamTable>
            <Button className="mb-3 mt-2" variant="success" onClick={sendUpdatedTeams}>Submit Lineup</Button>
            {success ? <Row><Col sm={3}><Alert variant="success">Submitted lineup!</Alert></Col></Row> : ''}
        </Col>
        : ''}
    </Container>);
}

export default TeamPage;