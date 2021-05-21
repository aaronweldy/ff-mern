import React, {useState, useEffect} from 'react'
import {useParams} from 'react-router-dom'
import LeagueButton from './LeagueButton'
import {Container, Table, Col, Form, Button, OverlayTrigger, Tooltip, Row, Image} from 'react-bootstrap'
import {auth} from '../firebase-config'
import '../CSS/LeaguePages.css'

const background_iters = ["first-background", "second-background", "third-background"]

const RunScores = () => {
    const {id} = useParams();
    const [teams, setTeams] = useState([]);
    const [league, setLeague] = useState(null);
    const [isCommissioner, setIsCommissioner] = useState(false);
    const [week, setWeek] = useState(1);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        const unsub = auth.onAuthStateChanged(async user => {
            const url = `/api/v1/league/${id}/`;
            const resp = await fetch(url);
            const json = await resp.json();
            console.log(json);
            setTeams(json.teams);
            setLeague(json.league.scoringSettings);
            setIsCommissioner(json.league.commissioners.includes(user.uid));
        });
        return () => unsub();
    }, [id]);
    const sendData = _ => {
        setLoading(true);
        const url = `/api/v1/league/${id}/runScores/`;
        const body = {week};
        const reqDict = {
            method: 'POST',
            headers: {"content-type" : "application/json"},
            body: JSON.stringify(body)
        }
        fetch(url, reqDict).then(resp => resp.json()).then(data => {
            setTeams(data.teams);
            setLoading(false);
        });
    }
    const teamSorter = (a, b) => {
        return (b.weekScores[week] + (b.addedPoints[week] || 0)) - (a.weekScores[week] + (a.addedPoints[week] || 0));
    };
    return (
        <Container className="ml-5">
            <Row>
                <LeagueButton id={id}></LeagueButton>
            </Row>
            <Row className="mb-4 mt-4">
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
            {teams.length > 0 ? teams.map((team, i) => {
                return (
                <React.Fragment key={i}>
                    <Row className="mb-3 align-items-center">
                        <Col sm="auto">
                            <Image className="image-fit-height" src={team.logo || process.env.REACT_APP_DEFAULT_LOGO}></Image>
                        </Col>
                        <Col sm="auto" className="align-items-center">
                            <h3>{team.name}</h3>
                            <div className="subtitle">{team.ownerName}</div>
                        </Col>
                    </Row>
                    <Row>
                        <Table striped bordered hover className="table-width">
                            <thead>
                                <tr>
                                    <th>Lineup</th>
                                    <th>Position</th>
                                    <th>Player Name</th>
                                    <th>Points</th>
                                    {league ? league.map((stat, i) => {
                                        const cat = stat.category;
                                        return <th key={i}>{cat.qualifier} {cat.qualifier === 'between' ? cat.threshold_1 + "/" + cat.threshold_2 : cat.threshold} {cat.statType}</th>
                                    }) : null} 
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
                                    return (
                                    <tr key={i}>
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
                                        }) : null}
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
                                        {((team.weekScores[week] || 0) + (team.addedPoints[week] || 0)).toFixed(2)}
                                    </td>
                                </tr>
                            </tbody>
                        </Table>
                    </Row>
                </React.Fragment>
            )}) : ''}
            <Row>
                    <Table striped bordered hover className="table-width">
                        <thead>
                            <tr>
                                <th>Place</th>
                                <th>Team Name</th>
                                <th>Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teams.sort(teamSorter).map((team, i) => {
                                return (
                                    <tr key={i} id={i <= 2 ? background_iters[i] : ''}>
                                        <td>{i+1}</td>
                                        <td>{team.name}</td>
                                        <td>{((team.weekScores[week] || 0) + (team.addedPoints[week] || 0)).toFixed(2)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
            </Row>
            {isCommissioner ? 
            <Row className="mb-3">
                <Button variant="success" onClick={sendData}>Calculate Scores</Button>
            </Row> : ''}
            {loading ? <div className="spinning-loader"></div> : ''}
        </Container>
    );
}

export default RunScores;