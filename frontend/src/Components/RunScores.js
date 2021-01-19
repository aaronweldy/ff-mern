import React, {useState, useEffect} from 'react'
import {useParams} from 'react-router-dom'
import LeagueButton from './LeagueButton'
import {Container, Table, Col, Form, Button, Alert} from 'react-bootstrap'
import {useSelector} from 'react-redux'
import {selectUser} from '../Redux/userSlice.js'
import '../CSS/LeaguePages.css'

const RunScores = () => {
    const currUser = useSelector(selectUser);
    const {id} = useParams();
    const [teams, setTeams] = useState([]);
    const [league, setLeague] = useState(null);
    const [weekError, setError] = useState(false);
    const [week, setWeek] = useState(1);
    useEffect(() => {
        const url = `/api/v1/league/${id}/`;
        async function fetchTeams() {
            const resp = await fetch(url);
            const json = await resp.json();
            console.log(json);
            setTeams(json.teams);
            setLeague(json.scoringSettings);
        }
        fetchTeams();
    }, [id, currUser]);
    const sendData = _ => {
        if (week === -1) {
            setError(true);
            setTimeout(() => setError(false), 8000);
            return;
        }
        const url = `/api/v1/league/${id}/runScores/`;
        const body = {week};
        const reqDict = {
            method: 'POST',
            headers: {"content-type" : "application/json"},
            body: JSON.stringify(body)
        }
        fetch(url, reqDict).then(resp => resp.json()).then(data => {
            setTeams(data.teams);
        });
    }
    return (
        <Container className="ml-5"> 
            <LeagueButton id={id}></LeagueButton>
            {teams.length > 0 ? teams.map((team, i) => {
                return <Col md={12} key={i}>
                    <h3>{team.name}</h3>
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th style={{width: "10%"}}>Lineup</th>
                                <th style={{width: "10%"}}>Position</th>
                                <th style={{width: "30%"}}>Player Name</th>
                                <th style={{width: "10%"}}>Points</th>
                                {league ? league.map((stat, i) => {
                                    const cat = stat.category;
                                    const width = 30.0 / league.length;
                                    return <th key={i} style={{width}}>{cat.qualifier} {cat.qualifier === 'between' ? cat.threshold_1 + "/" + cat.threshold_2 : cat.threshold} {cat.statType}</th>
                                }) : <th></th>} 
                            </tr>
                        </thead>
                        <tbody>
                            {team.players.filter(player => player.lineup !== 'bench').map((player, i) => {
                                return (<tr key={i}>
                                    <td>
                                        <span>{player.lineup}</span>
                                    </td>
                                    <td>
                                        <span>{player.position}</span>
                                    </td>
                                    <td>
                                        <span>{player.name}</span>
                                    </td>
                                    <td>
                                        <span>{player.points[week] || 0}</span>
                                    </td>
                                    {league ? league.map((stat, i) => {
                                        const cat = stat.category;
                                        const hashVal = cat.qualifier === 'between' ? `${cat.qualifier}|${cat.threshold_1}${cat.threshold_2}|${cat.statType}` : `${cat.qualifier}|${cat.threshold}|${cat.statType}`;
                                        return (
                                        <td key={i}>
                                            {player.weekStats[week] ? player.weekStats[week][hashVal] || 0 : 0}
                                        </td>);
                                    }) : <td></td>}
                                </tr>);}) }
                            <tr>
                                <td colSpan="3">
                                    <b>Point Adjustment</b>
                                </td>
                                <td>
                                    {team.addedPoints[week] || 0}
                                </td>
                            </tr>
                            <tr>
                                <td colSpan="3">
                                    <b>Total points:</b>
                                </td>
                                <td>
                                    {(team.weekScores[week] || 0) + (team.addedPoints[week] || 0)}
                                </td>
                            </tr>
                        </tbody>
                    </Table>
                </Col>
            }) : ''}
            <Col md={1} className="mb-4">
                <Form.Label>Week:</Form.Label>
                <Form.Control as="select" defaultValue={week} onChange={e => setWeek(e.target.value)}>
                    {[...Array(17)].map((_, i) => {
                        return <option value={i+1} key={i}>{i+1}</option>;
                    })}
                </Form.Control>
            </Col>
            {weekError ? <Col md={3}><Alert className="mb-4" variant="warning">Invalid week entered</Alert></Col> : ''}
            <Col className="mb-5"> 
                <Button variant="success" onClick={sendData}>Calculate Scores</Button>
            </Col>
        </Container>
    );
}

export default RunScores;