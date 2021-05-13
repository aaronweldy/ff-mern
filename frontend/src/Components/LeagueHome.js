import React, {useState, useEffect} from 'react'
import {Redirect, useParams} from 'react-router-dom'
import {Table, Form, Container, Col, Button, Modal, Row, Tooltip, OverlayTrigger} from 'react-bootstrap'
import {auth} from '../firebase-config'
import 'firebase/auth'
import '../CSS/LeaguePages.css'

function LeagueHome(props) {
    const {id} = useParams();
    const [teams, setTeams] = useState([]);
    const [commissioners, setCommissioners] = useState([]);
    const [runScores, setRunScores] = useState(false);
    const [showDelete, setDelete] = useState(false);
    const [leagueName, setLeagueName] = useState("");
    const [deleteName, setName] = useState("");
    const [redirect, setRedirect] = useState(false);
    const user = auth.currentUser;
    useEffect(() => {
        const unsub = auth.onAuthStateChanged(async user => {
            if (user) {
                const url = `/api/v1/league/${id}/`;
                const resp = await fetch(url);
                const json = await resp.json();
                const sortedTeams = json.teams.sort((a, b) => {
                    const reducer = (acc, i) => acc + i ? i : 0;
                    return a.weekScores.reduce(reducer, 0) + a.addedPoints.reduce(reducer, 0) > b.weekScores.reduce(reducer, 0) + b.addedPoints.reduce(reducer, 0) ? -1 : 1;
                })
                setTeams(sortedTeams);
                console.log(json.teams);
                if (user) console.log(user.uid);
                setCommissioners(json.commissioners);
                setLeagueName(json.name);
            }
        });
        return () => unsub();
    }, [id, user]);
    if (runScores) return <Redirect to={'/league/' + id + '/runScores/'}></Redirect>;

    const deleteLeague = _ => {
        const url = `/api/v1/league/${id}/delete/`;
        const body = {user: user ? user.uid : 0};
        console.log(body);
        const reqDict = {
            headers: {"content-type" : "application/json"},
            method: 'POST',
            body: JSON.stringify(body)
        }
        fetch(url, reqDict).then(resp => {
            if (!resp.ok) throw Error(resp.statusText);
            return resp.json();
        }).then(_ => {
            setRedirect(true);
        }).catch(e => {
            console.log(e);
        });
    }

    if (redirect) return <Redirect to="/"></Redirect>;

    return (
    <Container id="small-left">
        <Modal show={showDelete} onHide={() => setDelete(false)}>
            <Modal.Header closeButton>
                <Modal.Title>Delete League</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                Type the name of the league to confirm deletion:
                <Form.Group className="mt-3" as={Row}>
                    <Col md={6}>
                        <Form.Control type="text" onChange={e => setName(e.target.value)}></Form.Control>
                    </Col>
                </Form.Group>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => setDelete(false)}>
                    Close
                </Button>
                <Button disabled={deleteName !== leagueName} variant="danger" onClick={deleteLeague}>
                    Confirm Deletion
                </Button>
            </Modal.Footer>
        </Modal>
        <Col className="mb-3 mt-3">
            <h1>{teams.length > 0 ? teams[0].leagueName : ''}</h1>
            <hr/>
            {user && commissioners.includes(user.uid) ?
            <div>
                <div>
                    <a href={"/league/" + id + "/editTeams/"}>Edit Teams</a>
                </div>
                <div>
                    <a href={"/league/" + id + "/editSettings/"}>Edit Scoring</a>
                </div>
                <div>
                    <a href={"/league/" + id + "/addPoints/"}>Adjust Weekly Scores</a>
                </div>
                <div>
                    <a href={"/league/" + id + "/adjustLineups/"}>Adjust Starting Lineups</a>
                </div>
                <div>
                    <Button id="inline-button" variant="link" onClick={() => setDelete(true)}>Delete League</Button>
                </div>
                <hr/>
            </div>
            : ''}
        </Col>
        <Col sm="auto">
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Team Name</th>
                        <th>Team Owner</th>
                        {[...Array(17).fill().map((_, i) => {
                            return <th key={i}>{i+1}</th>
                        })]}
                        <th>Total Points</th>
                    </tr>
                </thead>
                <tbody>
                    {teams.map((team, i) => {
                        console.log((team.weekScores[14] + (team.addedPoints[14] || 0)).toPrecision(5));
                        const linked = team.ownerName !== 'default' ? <a href={process.env.REACT_APP_PUBLIC_URL + "/user/" + team.owner}>{team.ownerName}</a> : team.ownerName;
                        return (<tr key={i}>
                            <td>
                                <a href={"/league/" + id + "/team/" + team._id + "/"}>{team.name}</a>
                            </td>
                            <td>
                                {commissioners.includes(team.owner) ? 
                                <OverlayTrigger position="top" overlay={<Tooltip>Commissioner</Tooltip>}>
                                    <span><b>{linked}</b></span>
                                </OverlayTrigger> : <span>{linked}</span>}
                            </td>
                            {[...Array(17).fill().map((_, i) => {
                                return <td key={i}>{team.weekScores[i + 1] ? (team.weekScores[i+1] + (team.addedPoints[i+1] || 0)).toPrecision(5) : 0}</td>
                            })]}
                            <td>
                                {(team.weekScores.reduce((acc, i) => acc + i, 0) + (team.addedPoints.reduce((acc, i) => acc + i, 0))).toPrecision(6)}
                            </td>
                        </tr>);
                    })}
                </tbody>
            </Table>
        </Col>
        {user && commissioners.includes(user.uid) ? <Button className="mt-3 ml-3 mb-3" variant="primary" onClick={() => setRunScores(true)}>Run Scores</Button>
        : <Button className="mt-3 ml-3 mb-3" variant="primary" onClick={() => setRunScores(true)}>View Weekly Scoring Breakdown</Button>}
    </Container>);
}

export default LeagueHome;