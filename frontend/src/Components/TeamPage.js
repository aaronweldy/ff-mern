import React, {useState, useEffect} from 'react'
import {useParams} from 'react-router-dom'
import {Container, Col, Button, Alert, Row, Form} from 'react-bootstrap'
import TeamTable from './TeamTable'
import LeagueButton from './LeagueButton'

function TeamPage(props) {
    const {id, leagueId} = useParams();
    const [team, setTeam] = useState(null);
    const [success, setSuccess] = useState(false);
    const [lineupSettings, setLineupSettings] = useState(null);
    const [week, setWeek] = useState(1);
    const [userIsOwner, setIsOwner] = useState(false);
    const url = `/api/v1/league/${leagueId}/team/${id}/`;
    useEffect(() => {
        async function fetchTeam() {
            const resp = await fetch(url);
            const data = await resp.json();
            setTeam(data.team);
            setLineupSettings(data.league.lineupSettings);
            setIsOwner(data.team.owner === props.userId);
        }
        fetchTeam();
    }, [url, week, props.userId]);
    const handlePlayerChange = (selectedPlayer, name, swapPlayer) => {
        console.log(`${selectedPlayer}, ${name}, ${swapPlayer}`);
        if (name === "starters") {
            swapPlayer['lineup'][week] = selectedPlayer['lineup'][week];
            selectedPlayer['lineup'][week] = 'bench';
        }
        else {
            selectedPlayer['lineup'][week] = swapPlayer['lineup'][week];
            if(swapPlayer.name !== '') {
                swapPlayer['lineup'][week] = 'bench';
            }
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
            <Row>
                <Col>
                <h1 className="mt-2">
                    {team.name}
                    <div className="subtitle mb-3 mt-2">{team.ownerName}</div>
                </h1>
                </Col>
            </Row>
            <Row>
                <Col sm="auto" className="mt-1">
                <Form.Label>Week:</Form.Label>
                </Col>
                <Col sm="auto">
                <Form.Control as="select" defaultValue={week} onChange={e => setWeek(e.target.value)}>
                    {[...Array(17)].map((_, i) => {
                        return <option value={i+1} key={i}>{i+1}</option>;
                    })}
                </Form.Control>
                </Col>
            </Row>
                <h3>Starters</h3>
                <TeamTable isOwner={userIsOwner} players={starters} oppPlayers={bench} week={week} name="starters" handleBenchPlayer={handleBenchPlayer} handlePlayerChange={handlePlayerChange}></TeamTable>
                <h3>Bench</h3>
                <TeamTable isOwner={userIsOwner} players={bench} oppPlayers={starters} week={week} name="bench" handleBenchPlayer={handleBenchPlayer} handlePlayerChange={handlePlayerChange}></TeamTable>
                <Button className="mb-3 mt-2" variant="success" onClick={sendUpdatedTeams}>Submit Lineup</Button>
                {success ? <Row><Col sm={3}><Alert variant="success">Submitted lineup!</Alert></Col></Row> : ''}
            
            </Col>
            : ''}
        </Container>);
}

export default TeamPage;