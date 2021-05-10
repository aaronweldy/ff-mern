import React, {useState, useEffect} from 'react'
import {useSelector} from 'react-redux'
import {selectUser} from '../Redux/userSlice'
import {Redirect, useParams} from 'react-router-dom'
import {Table, Container, Col, Form, Button, Row, OverlayTrigger} from 'react-bootstrap'
import LeagueButton from './LeagueButton'


const EditTeams = () => {
    const currUser = useSelector(selectUser);
    const [teams, setTeams] = useState([]);
    const [isCommissioner, setIsCommissioner] = useState(false);
    const [redirect, setRedirect] = useState(false);
    const {id} = useParams();
    useEffect(() => {
        async function fetchLeague() {
            const url = `/api/v1/league/${id}/`;
            const data = await fetch(url);
            const json = await data.json();
            if(json.commissioners.includes(currUser.id)) setIsCommissioner(true);
            setTeams(json.teams);
        }
        fetchLeague();
    }, [id, currUser]);
    const handleAddPlayer = e => {
        const tempTeams = [...teams];
        tempTeams[e.target.dataset.id]['players'].push({name: '', position: 'QB', lineup: [...Array(17).fill('bench')], points: [], weekStats: []});
        setTeams(tempTeams);
    }

    const handlePlayerChange = e => {
        const tempTeams = [...teams];
        if(e.target.name === "remove") {
            tempTeams[e.target.dataset.team]['players'].splice(e.target.dataset.id, 1);
        }
        else tempTeams[e.target.dataset.team]['players'][e.target.dataset.id][e.target.name] = e.target.value;
        setTeams(tempTeams);
    }

    const handleInfoChange = e => {
        const tempTeams = [...teams];
        tempTeams[e.target.dataset.id][e.target.name] = e.target.value;
        setTeams(tempTeams);
    }

    const sendUpdatedTeams = _ => {
        const url = `/api/v1/league/updateTeams/`;
        const body = {teams};
        const reqdict = {
            method : 'POST', 
            headers : {'content-type' : 'application/json'},
            body : JSON.stringify(body)
        };
        fetch(url, reqdict)
        .then(data => data.json())
        .then(json => console.log(json));
        setRedirect(true);
    }
    if ((teams.length > 0 && !isCommissioner) || redirect) return <Redirect to={'/league/' + id + '/'}></Redirect>;
    return (
        <Container fluid>
            <Row className="justify-content-center">
                <LeagueButton id={id}></LeagueButton>
            </Row>
            <Row className="justify-content-center">
            {teams ? teams.map((team, i) => {
                return(
                <Col md={4} key={i} className="bordered-row m-3 p-3">
                    <Form.Group as={Row} className="mt-3">
                        <Form.Label column md={4}>Team Name</Form.Label>
                        <Col md={8}>
                            <Form.Control data-id={i} name="name" onChange={handleInfoChange} size="lg" type="text" value={team.name}></Form.Control>
                        </Col>
                    </Form.Group>
                    <Row className="mb-2">
                        <Form.Label column md={4}>Team Owner</Form.Label>
                        <Col md={8}>
                            <Form.Control data-id={i} name="ownerName" onChange={handleInfoChange} size="md" type="text" value={team.ownerName}></Form.Control>
                        </Col>
                    </Row>
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th>Position</th>
                                <th>Player Name</th>
                            </tr>
                        </thead>
                        <tbody>
                            {team.players.map((player, j) =>
                            <OverlayTrigger key={j} placement="left" delay="1000" overlay={<Button onClick={handlePlayerChange} name="remove" variant="danger" data-team={i} data-id={j}>X</Button>}>
                            <tr>
                                <td>
                                    <Form.Control name="position" data-team={i} data-id={j} as="select" value={player.position} onChange={handlePlayerChange}>
                                        <option value="QB">QB</option>
                                        <option value="RB">RB</option>
                                        <option value="WR">WR</option>
                                        <option value="TE">TE</option>
                                        <option value="K">K</option>
                                    </Form.Control>
                                </td>
                                <td>
                                    <input name="name" data-team={i} data-id={j} type="text" value={player.name} onChange={handlePlayerChange}></input>
                                </td>
                            </tr>
                            </OverlayTrigger>
                            )}
                        </tbody>
                    </Table>
                    <Row className="justify-content-center mb-2">
                        <Button data-id={i} onClick={handleAddPlayer} variant="primary">Add Player</Button>
                    </Row>
                </Col>);
            }) : ''}
            </Row>
            <Row className="justify-content-center m-5">
                <Button onClick={sendUpdatedTeams} variant="success">Submit Teams</Button>
            </Row>
        </Container>
    );

}

export default EditTeams;