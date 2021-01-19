import React, {useState} from 'react'
import {Container, Col, Table, Form, Dropdown, DropdownButton, Button, Row} from 'react-bootstrap'
import {Redirect} from 'react-router-dom'

const positionTypes = ["QB", "RB", "WR", "TE", "K", "WR/RB", "WR/RB/TE", "QB/WR/RB/TE"];

function CreateLeague() {
    const [numTeams, setNumTeams] = useState(0);
    const [teams, setTeams] = useState([]);
    const [partTwo, setPartTwo] = useState(false);
    const [partThree, setPartThree] = useState(false);
    const [redirect, setRedirect] = useState(false);
    const [leagueName, setLeagueName] = useState('');
    const [posInfo, setPosInfo] = useState({});
    const [leagueId, setLeagueId] = useState(0);
    function handleTeamChange(e) {
        const tempTeams = [...teams];
        if(e.target.name === 'isCommissioner') {
            tempTeams[e.target.dataset.id][e.target.name] = !tempTeams[e.target.dataset.id][e.target.name];
        }
        else tempTeams[e.target.dataset.id][e.target.name] = e.target.value;
        setTeams(tempTeams);
    }
    function handleSizeChange(evtKey, _) {
        setNumTeams(parseInt(evtKey));
        setTeams(Array(parseInt(evtKey)).fill().map((_, i) => ({teamName: 'Team ' + i, teamOwner: '', isCommissioner: false})));
    }
    function handleInfoChange(e) {
        const tempInfo = {...posInfo};
        tempInfo[e.target.name] = e.target.value;
        setPosInfo(tempInfo);
    }
    async function handleLeagueSubmission(e) {
        e.preventDefault();
        const reqBody = {
            "league": leagueName,
            "teams": teams,
            posInfo
        }
        const resp = await fetch('/api/v1/league/create/', {method: 'POST', body: JSON.stringify(reqBody), headers: {'content-type' : 'application/json'}});
        const json = await resp.json();
        setLeagueId(json.id);
        setRedirect(true);
    }
    if (redirect) {
        return <Redirect to={'/league/' + leagueId + '/'}></Redirect>
    }
    const subButton = partThree ? <Button variant="primary" onClick={handleLeagueSubmission}>&gt;&gt;</Button> : <Button variant="primary" onClick={_ => partTwo ? setPartThree(true) : setPartTwo(true)}>&gt;&gt;</Button>
    return (
        <Container>
            <Form.Row className="align-items-center mt-5">
                <Form.Label>League Name:</Form.Label>
                <Col sm={6}>
                    <Form.Control placeholder="My Fantasy League" onChange={e => setLeagueName(e.target.value)}></Form.Control>
                </Col>
            </Form.Row>
            <Form.Row className="align-items-center">
                <Form.Label>Select number of teams:</Form.Label>
                <DropdownButton variant="primary" className="m-3" title={numTeams} onSelect={handleSizeChange}>
                    {[...Array(15)].map((_, i) => <Dropdown.Item key={i} eventKey={i}>{i}</Dropdown.Item>)}
                </DropdownButton>
            </Form.Row>
            {partTwo ? 
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Team Name</th>
                        <th>Team Owner</th>
                        <th>Commissioner</th>
                    </tr>
                </thead>
                <tbody>
                    {teams.map((team, i) =>
                    <tr key={i}>
                        <td>
                            <input name="teamName" data-id={i} type="text" value={team.teamName} onChange={handleTeamChange}></input>
                        </td>
                        <td>
                            <input name="teamOwner" data-id={i} type="text" value={team.teamOwner} onChange={handleTeamChange}></input>
                        </td>
                        <td>
                            <Form.Check data-id={i} name="isCommissioner" onChange={handleTeamChange}></Form.Check>
                        </td>
                    </tr>)}
                </tbody>
            </Table> 
            : ''}
            {partThree ?
            <Form>
                <h4>Set number of players per position.</h4>
                {positionTypes.map((type, i) => {
                return(
                    <Form.Group key={i} as={Row} md={6}>
                        <Col>
                            <Form.Label md={2}>{type}:</Form.Label>
                        </Col>
                        <Col md={1}>
                            <Form.Control data-id={i} name={type} onChange={handleInfoChange} size="md" type="text"></Form.Control>
                        </Col>
                    </Form.Group>
                )})}
            </Form> : ''}
            <Form.Row className="mb-3">{subButton}</Form.Row>
        </Container>
    )
}

export default CreateLeague;