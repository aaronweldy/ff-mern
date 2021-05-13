import React, {useEffect, useState} from 'react'
import {useParams} from 'react-router-dom'
import { Card, CardDeck, Container, Row, Col, Button, Form, Alert, Modal, ModalBody } from 'react-bootstrap'
import firebase, {auth} from '../firebase-config'
import '../CSS/LeaguePages.css'

const User = () => {
    const {userid} = useParams();
    let [teams, setTeams] = useState([]);
    let [changePassword, setChangePassword] = useState(false);
    let [oldPassword, setOldPassword] = useState("");
    let [newPassword, setNewPassword] = useState([...Array(2)]);
    let [unmatched, setUnmatched] = useState(true);
    let [incorrectPassword, setIncorrectPassword] = useState(false);
    let [success, setSuccess] = useState(false);
    const currUser = auth.currentUser;
    useEffect(() => {
        const unsub = auth.onAuthStateChanged(user => {
            if (user) {
                const url = `/api/v1/user/${userid}/leagues/`;
                fetch(url).then(resp => {
                    if(!resp.ok) throw Error(resp.statusText);
                    return resp.json();
                }).then(data => {
                    setTeams(data.teams);
                }).catch(e => {
                    console.log(e);
                });
            }
        });
        return () => unsub();
    }, [userid]);

    const handlePasswordChange = (e, ind) => {
        const tempPass = [...newPassword];
        tempPass[ind] = e.target.value;
        setUnmatched(tempPass[0] !== tempPass[1] || tempPass[0] === "");
        setNewPassword(tempPass);
    }

    const handlePasswordSubmission = _ => {
        const providedCredential = firebase.auth.EmailAuthProvider.credential(currUser.email, oldPassword);
        currUser.reauthenticateWithCredential(providedCredential).then(() => {
            currUser.updatePassword(newPassword[0])
            .then(_ => {
                setSuccess(true);
                setIncorrectPassword(false);
                setTimeout(() => {
                    setChangePassword(false);
                    setSuccess(false);
                }, 2000);
            }).catch(_ => {
                console.log(_);
                setIncorrectPassword(true);
                setSuccess(false);
            });
        }).catch(_ => {
            console.log(_);
            setIncorrectPassword(true);
            setSuccess(false);
        });
		
    }
    return (
        <Container fluid>
        <Col>
            <Row className="justify-content-center mb-3 mt-3">
                <h1>
                    {currUser ? currUser.displayName : ''}
                </h1>
            </Row>
            {currUser && userid === currUser.uid ?
            <Row className="justify-content-center mb-3">
                <Button onClick={() => setChangePassword(!changePassword)}>Change Password</Button>
            </Row>
            : ''}
            {currUser?
            <PasswordModal changePassword={changePassword} unmatched={unmatched} 
            incorrectPassword={incorrectPassword} success={success} handlePasswordChange={handlePasswordChange} 
            setOldPassword={setOldPassword} handlePasswordSubmission={handlePasswordSubmission}
            handleHide={() => setChangePassword(false)}></PasswordModal>
            : ''}
            <Row className="justify-content-center">
            <Col sm={10}>
                <CardDeck id="teamCards">
                {teams.map((team, index) => {
                return (
                <Card key={index} className="m-2">
                    <a href={'/league/' + team.league + '/team/' + team._id + '/'}>
                        <Card.Img variant="top" src={team.logo} className="card-img-top"></Card.Img>
                    </a>
                    <Card.Body>
                        <Card.Title>
                        {team.name}
                        </Card.Title>
                        <Card.Text>
                        {team.leagueName}
                        </Card.Text>
                        <Button href={'/league/' + team.league + '/'}>Go to league</Button>
                    </Card.Body>
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

const PasswordModal = (props) => {

    return (
        <Modal show={props.changePassword} onHide={props.handleHide}>
            <Modal.Header>
                <Modal.Title>
                    Change Password
                    <div className="subtitle">
                        If you used Google to sign in, this option will do nothing.
                    </div>
                    <div className="subtitle">
                        Password must be at least six characters.
                    </div>
                </Modal.Title>
            </Modal.Header>
            <ModalBody>
            <Form.Group as={Row}>
                <Form.Label column>Old Password:</Form.Label>
                <Col>
                    <Form.Control type="password" onChange={e => props.setOldPassword(e.target.value)}></Form.Control>
                </Col>
                
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column>New Password:</Form.Label>
                <Col>
                    <Form.Control type="password" onChange={e => props.handlePasswordChange(e, 0)}></Form.Control>
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column>Retype New Password:</Form.Label>
                <Col>
                    <Form.Control type="password" onChange={e => props.handlePasswordChange(e, 1)}></Form.Control>
                </Col>
            </Form.Group>
            {props.unmatched ? 
                <Row>
                    <Col>
                        <Alert variant="danger">
                            New passwords must match exactly.
                        </Alert>
                    </Col>
                </Row>
            : ''}
            {props.incorrectPassword ? 
                <Row>
                    <Col>
                        <Alert variant="danger">
                            Incorrect previous password entered.
                        </Alert>
                    </Col>
                </Row>
            : ''}
            {props.success ? 
                <Row>
                    <Col>
                        <Alert variant="success">
                            Successfully updated password!
                        </Alert>
                    </Col>
                </Row>
            : ''}
            </ModalBody>
            <Modal.Footer>
                <Button disabled={props.unmatched} variant="success" onClick={props.handlePasswordSubmission}>Submit New Password</Button>
            </Modal.Footer>
        </Modal>
    );
}

export default User;
