import React, {useState, useEffect} from 'react'
import {useParams} from 'react-router-dom'
import LeagueButton from './LeagueButton'
import {Container, Table, Col, Form, Button, OverlayTrigger, Tooltip, Row} from 'react-bootstrap'
import {useSelector} from 'react-redux'
import {selectUser} from '../Redux/userSlice.js'
import '../CSS/LeaguePages.css'

const background_iters = ["first-background", "second-background", "third-background"]

const RunScores = () => {
    const currUser = useSelector(selectUser);
    const {id} = useParams();
    const [teams, setTeams] = useState([]);
    const [league, setLeague] = useState(null);
    const [isCommissioner, setIsCommissioner] = useState(false);
    const [week, setWeek] = useState(1);
    useEffect(() => {
        const url = `/api/v1/league/${id}/`;
        async function fetchTeams() {
            const resp = await fetch(url);
            const json = await resp.json();
            console.log(json);
            setTeams(json.teams);
            setLeague(json.scoringSettings);
            setIsCommissioner(json.commissioners.includes(currUser.id));
        }
        fetchTeams();
    }, [id, currUser]);
    const sendData = _ => {
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
    const teamSorter = (a, b) => {
        const reducer = (acc, i) => acc + i ? i : 0;
        return a.weekScores.reduce(reducer, 0) + a.addedPoints.reduce(reducer, 0) > b.weekScores.reduce(reducer, 0) + b.addedPoints.reduce(reducer, 0) ? -1 : 1;
    };
    return (
        <Container className="ml-5"> 
            <LeagueButton id={id}></LeagueButton>
            <Col md={1} className="mb-4">
                <Form.Label>Week:</Form.Label>
                <Form.Control as="select" defaultValue={week} onChange={e => setWeek(e.target.value)}>
                    {[...Array(17)].map((_, i) => {
                        return <option value={i+1} key={i}>{i+1}</option>;
                    })}
                </Form.Control>
            </Col>
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
                            {team.players.filter(player => player.lineup[week] !== 'bench').map((player, i) => {
                                const nameCard = player.error ?
                                <OverlayTrigger key={i} placement="top" overlay={<Tooltip id="tooltip-top">
                                    Player not found in database. Make sure the name is spelled correctly.
                                </Tooltip>}>
                                <td className="error-background">
                                    <span>{player.name}</span>
                                </td>
                                </OverlayTrigger>
                                : <td><span>{player.name}</span></td>
                                return (<tr key={i}>
                                    <td>
                                        <span>{player.lineup[week]}</span>
                                    </td>
                                    <td>
                                        <span>{player.position}</span>
                                    </td>
                                    {nameCard}
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
            <Row>
                <Col md={4}>
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th style={{width: "15%"}}>Place</th>
                                <th style={{width: "35%"}}>Team Name</th>
                                <th style={{width: "60"}}>Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teams.sort(teamSorter).map((team, i) => {
                                return (
                                    <tr key={i} id={i <= 2 ? background_iters[i] : ''}>
                                        <td>{i+1}</td>
                                        <td>{team.name}</td>
                                        <td>{team.weekScores[week] + team.addedPoints[week]}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                </Col>
            </Row>
            {isCommissioner ? <Col className="mb-5"> 
                <Button variant="success" onClick={sendData}>Calculate Scores</Button>
            </Col> : ''}
        </Container>
    );
}

export default RunScores;