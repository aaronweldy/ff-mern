import React, {useState, useEffect} from 'react'
import {Redirect, useParams} from 'react-router-dom'
import {Table, Form, Container, Col, Row, Button} from 'react-bootstrap'
import {useSelector} from 'react-redux'
import {selectUser} from '../Redux/userSlice.js'
import LeagueButton from './LeagueButton'
import '../CSS/LeaguePages.css'

export default function AddPoints() {
    const currUser = useSelector(selectUser);
    const {id} = useParams();
    const [teams, setTeams] = useState([]);
    const [isCommissioner, setIsCommissioner] = useState(false);
    const [week, setWeek] = useState(1);
    const [redirect, setRedirect] = useState(false);
    useEffect(() => {
        const url = `/api/v1/league/${id}/`;
        async function fetchTeams() {
            const resp = await fetch(url);
            const json = await resp.json();
            setIsCommissioner(json.commissioners.includes(currUser.id));
            setTeams(json.teams);
        }
        fetchTeams();
    }, [id, currUser]);
    const handleAddedPoints = e => {
        const tempTeams = [...teams];
        tempTeams[e.target.dataset.id]['addedPoints'][week] = Number.parseFloat(e.target.value);
        setTeams(tempTeams);
    }
    const updateTeams = _ => {
        const body = { teams };
        const url = `/api/v1/league/adjustTeamSettings/`;
        const reqDict = {
            method: 'POST',
            headers: {"content-type" : "application/json"},
            body: JSON.stringify(body)
        }
        fetch(url, reqDict);
        setRedirect(true);
    }
    console.log(teams);
    if ((teams.length > 0 && !isCommissioner) || redirect) return <Redirect to={"/league/" + id + "/"}></Redirect>;
    return (
        <Container id="small-left">
            <LeagueButton id={id}></LeagueButton>
            <Row className="mt-3 mb-3">
                <Col className="justify-items-center align-self-center" md={1}>
                    <Form.Label>Week: </Form.Label>
                </Col>
                <Col md={1}>
                    <Form.Control as="select" defaultValue={week} onChange={e => setWeek(e.target.value)}>
                        {[...Array(17)].map((_, i) => {
                            return <option value={i+1} key={i}>{i+1}</option>;
                        })}
                    </Form.Control>
                </Col>
            </Row>
            <Table bordered>
                <thead>
                    <tr>
                        <th>Team Name</th>
                        <th>Points in Week</th>
                        <th>Points to Add</th>
                    </tr>
                </thead>
                <tbody>
                {teams ? teams.map((team, i) => {
                    if(team.addedPoints.length === 0) team.addedPoints = [...Array(17)].fill(0);
                    return (
                        <tr key={i}>
                            <td>{team.name}</td>
                            <td>{team.weekScores[week] || 0}</td>
                            <td>
                                <Form.Control value={team.addedPoints[week] || 0} data-id={i} onChange={handleAddedPoints} type="text"></Form.Control>
                            </td>
                        </tr>
                    );
                })
                : ''}
                </tbody>
            </Table>
            <Button variant="success" className="mt-5 mb-5" onClick={updateTeams}>Submit</Button>
        </Container>
    );
}