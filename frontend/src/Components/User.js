import React, {useEffect, useState} from 'react'
import {useSelector, useDispatch} from 'react-redux'
import {selectStatus, selectUser } from '../Redux/userSlice.js'
import {useHistory, useParams} from 'react-router-dom'
import { Card, CardDeck, Navbar, Container, Row, Col, Button, Form, Alert } from 'react-bootstrap'
import '../CSS/LeaguePages.css'

const User = () => {
    const dispatch = useDispatch();
    const {username} = useParams();
    const loggedIn = useSelector(selectStatus);
    const history = useHistory();
    const currUser = useSelector(selectUser);
    let [teams, setTeams] = useState([]);
    let [changePassword, setChangePassword] = useState(false);
    let [oldPassword, setOldPassword] = useState("");
    let [newPassword, setNewPassword] = useState([...Array(2)]);
    let [unmatched, setUnmatched] = useState(true);
    let [incorrectPassword, setIncorrectPassword] = useState(false);
    let [success, setSuccess] = useState(false);
    useEffect(() => {
        async function fetchTeams() {
        const url = `/api/v1/user/${username}/leagues/`;
        const reqDict = {
            token: localStorage.getItem('userToken'),
        }
        await fetch(url, {credentials: "include", headers: reqDict}).then(resp => {
            if(!resp.ok) throw Error(resp.statusText);
            return resp.json();
        }).then(data => {
            setTeams(data.teams);
        }).catch(e => {
            console.log(e);
        });
        
        }
        if(loggedIn) {
            fetchTeams();
        }
    }, [dispatch, history, username, loggedIn]);

    const handlePasswordChange = (e, ind) => {
        const tempPass = [...newPassword];
        tempPass[ind] = e.target.value;
        setUnmatched(tempPass[0] !== tempPass[1] || tempPass[0] === "");
        setNewPassword(tempPass);
    }

    const handlePasswordSubmission = _ => {
		const url = `/api/v1/user/updatePassword/`;
		const headers = {
            "content-type": "application/json",
			token: localStorage.getItem('userToken')
		}
        const body = {
            oldPassword,
            newPassword: newPassword[0]
        }
        const reqDict = {
            credentials: "include",
            method: "POST",
            body: JSON.stringify(body),
            headers
        }
        console.log(reqDict);
		fetch(url, reqDict).then(resp => {
            if(!resp.ok) {
                throw Error(resp.statusText);
            }
            return resp.statusText;
		}).then(_ => {
			setSuccess(true);
            setIncorrectPassword(false);
		}).catch(_ => {
			setIncorrectPassword(true);
            setSuccess(false);
		});
    }
    return (
        <Container fluid>
        <Col>
            <Row className="justify-content-center mb-3">
                <h1>
                    {username}
                </h1>
            </Row>
            {username === currUser.username ?
            <Row className="justify-content-center mb-3">
                <Button onClick={() => setChangePassword(!changePassword)}>Change Password</Button>
            </Row>
            : ''}
            {changePassword ?
            <div>
                <Form.Group as={Row} className="justify-content-center">
                    <Form.Label column sm={2}>Old Password:</Form.Label>
                    <Col sm={2}>
                        <Form.Control type="text" onChange={e => setOldPassword(e.target.value)}></Form.Control>
                    </Col>
                    
                </Form.Group>
                <Form.Group as={Row} className="justify-content-center">
                    <Form.Label column sm={2}>New Password:</Form.Label>
                    <Col sm={2}>
                        <Form.Control type="text" onChange={e => handlePasswordChange(e, 0)}></Form.Control>
                    </Col>
                </Form.Group>
                <Form.Group as={Row} className="justify-content-center">
                    <Form.Label column sm={2}>Retype New Password:</Form.Label>
                    <Col sm={2}>
                        <Form.Control type="text" onChange={e => handlePasswordChange(e, 1)}></Form.Control>
                    </Col>
                </Form.Group>
                <Row className="justify-content-center mb-3">
                    <Button disabled={unmatched} variant="success" onClick={handlePasswordSubmission}>Submit New Password</Button>
                </Row>
                {unmatched ? 
                    <Row className="justify-content-center">
                        <Col sm={4}>
                            <Alert variant="danger">
                                New passwords must match exactly.
                            </Alert>
                        </Col>
                    </Row>
                : ''}
                {incorrectPassword ? 
                    <Row className="justify-content-center">
                        <Col sm={4}>
                            <Alert variant="danger">
                                Incorrect previous password entered.
                            </Alert>
                        </Col>
                    </Row>
                : ''}
                {success ? 
                    <Row className="justify-content-center">
                        <Col sm={4}>
                            <Alert variant="success">
                                Successfully updated password!
                            </Alert>
                        </Col>
                    </Row>
                : ''}
                </div>
            : ''}
            <Row className="justify-content-center">
            <Col sm={10}>
                <CardDeck id="teamCards">
                {teams.map((team, index) => {
                return (
                <Card key={index} className="m-2">
                    <Card.Img variant="top" src={team.logo} className="card-img-top"></Card.Img>
                    <Card.Title>
                    <Navbar.Brand href={'/league/' + team.league + '/team/' + team._id + '/'}>{team.name}</Navbar.Brand>
                    </Card.Title>
                    <Card.Text>
                    <a href={'/league/' + team.league + '/'}>{team.leagueName}</a>
                    </Card.Text>
                    {team.isCommissioner ? <Card.Footer>Commissioner</Card.Footer> : ''}
                </Card>);
                })}
                </CardDeck>
            </Col>
            </Row>
        </Col>
        </Container>
    );
}

export default User;
