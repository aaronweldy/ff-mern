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
    const [success, setSuccess] = useState(false);
    const [lineupSettings, setLineupSettings] = useState(null);
    const [week, setWeek] = useState(1);
    const currUser = useSelector(selectUser);
    const url = `/api/v1/league/${leagueId}/team/${id}/`;
    useEffect(() => {
        async function fetchTeam() {
            const resp = await fetch(url);
            const data = await resp.json();
            setTeam(data.team);
            setLineupSettings(data.league.lineupSettings);
        }
        fetchTeam();
    }, [url, week]);
    const handlePlayerChange = (selectedPlayer, name, swapPlayer) => {
        console.log(`${selectedPlayer}, ${name}, ${swapPlayer}`);
        if (name === "starters") {
            swapPlayer['lineup'][week] = selectedPlayer['lineup'][week];
            selectedPlayer['lineup'][week] = 'bench';
        }
        else {
            if(swapPlayer.name !== '') {
                swapPlayer['lineup'][week] = 'bench';
            }
            selectedPlayer['lineup'][week] = swapPlayer['lineup'][week];
        }
        setTeam({...team});
    };
    const handleBenchPlayer = (selectedPlayer, i) => {
        selectedPlayer['lineup'][week] = 'bench';
        setTeam({...team});
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
    let starters = [];
    let bench = [];
    if (team && lineupSettings) {
        starters = (Object.keys(lineupSettings).map(pos => {
            return [...Array(parseInt(lineupSettings[pos])).fill().map(_ => { return {"position" : pos, "name" : '', "lineup" : [...Array(17).fill(pos)]} })];
        }).flat());
        team.players.filter(player => player.lineup[week] !== 'bench').forEach(starter => {
            starters[starters.findIndex(player => player.position === starter.position && player.name === '')] = starter;
        });
        bench = team.players.filter(player => player.lineup[week] === 'bench');
        console.log(lineupSettings ? "true" : "false")
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