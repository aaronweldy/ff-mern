import React, {useState, useEffect} from 'react'
import {Redirect, useParams} from 'react-router-dom'
import {Alert, Container, Col, Row, Button, Form} from 'react-bootstrap'
import {auth} from '../firebase-config'
import LeagueButton from './LeagueButton'
import TeamTable from './TeamTable'
import {lineupSorter} from '../constants.js'
import '../CSS/LeaguePages.css'

export default function AdjustLineups() {
    const {id} = useParams();
    const [teams, setTeams] = useState([]);
    const [isCommissioner, setIsCommissioner] = useState(false);
    const [lineupSettings, setLineupSettings] = useState({});
    const [success, setSuccess] = useState(false);
    const [week, setWeek] = useState(1);
    useEffect(() => {
        const unsub = auth.onAuthStateChanged(async user => {
            const url = `/api/v1/league/${id}/`;
            const resp = await fetch(url);
            const data = await resp.json();
            setIsCommissioner(data.league.commissioners.includes(user.uid));
            setTeams(data.teams);
            setLineupSettings(data.league.lineupSettings);
        });
        return () => unsub();
    }, [id, week]);
    const handlePlayerChange = (selectedPlayer, name, swapPlayer) => {
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
        setTeams([...teams]);
    };
    const handleBenchPlayer = selectedPlayer=> {
        const tempTeams = [...teams];
        selectedPlayer['lineup'][week] = 'bench';
        setTeams(tempTeams);
    }
    const submitLineups = _ => {
        const tempTeams = [...teams];
        for (const team of tempTeams) {
            team.players = team.players.filter(player => player.name !== '');
        }
        const url = `/api/v1/league/updateTeams/`;
        const body = {teams: tempTeams};
        const reqdict = {
            method : 'POST', 
            headers : {'content-type' : 'application/json'},
            body : JSON.stringify(body)
        };
        fetch(url, reqdict)
        .then(data => data.json())
        .then(json => {
            setSuccess(true);
            setTimeout(() => setSuccess(false), 8000);
        });
    }
    if (teams && (teams.length && !isCommissioner)) return <Redirect to={"/league/" + id + "/"}></Redirect>;
    return (
        <Container id="small-left">
            <LeagueButton id={id}></LeagueButton>
            <Col md={1} className="mt-5 mb-4">
                <Form.Label>Week:</Form.Label>
                <Form.Control as="select" defaultValue={week} onChange={e => setWeek(e.target.value)}>
                    {[...Array(17)].map((_, i) => {
                        return <option value={i+1} key={i}>{i+1}</option>;
                    })}
                </Form.Control>
            </Col>
            {teams ? teams.map((team, i) => {
                const starters = (Object.keys(lineupSettings).sort(lineupSorter).map(pos => {
                    return [...Array(parseInt(lineupSettings[pos])).fill().map(_ => { return {"position" : pos, "name" : '', "lineup" : [...Array(17).fill(pos)]} })];
                }).flat());
                team.players.filter(player => player.lineup[week] !== 'bench').forEach(starter => {
                    starters[starters.findIndex(player => player.lineup[week] === starter.lineup[week] && player.name === '')] = starter;
                });
                const bench = team.players.filter(player => player.lineup[week] === 'bench');
                return (
                <Col key={i}>
                    <div>
                        <h2>{team.name}</h2>
                    </div>
                    <h4>Starters</h4>
                    <TeamTable players={starters} week={week} tableId={i} oppPlayers={bench} name="starters" handleBenchPlayer={handleBenchPlayer} handlePlayerChange={handlePlayerChange} isOwner={true}></TeamTable>
                    <h4>Bench</h4>
                    <TeamTable players={bench} week={week} tableId={i} oppPlayers={starters} name="bench" handleBenchPlayer={handleBenchPlayer} handlePlayerChange={handlePlayerChange} isOwner={true}></TeamTable>
                </Col>
                );
            }) : ''}
            <Col>
                <Button variant="success" className="mt-5 mb-2" onClick={submitLineups}>Submit Lineups</Button>
            </Col>
            {success ? <Row><Col sm={3}><Alert className="mb-3" variant="success">Submitted lineups!</Alert></Col></Row> : ''}
        </Container>
    );
}