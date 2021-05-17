import React, {useEffect, useState, useReducer, useCallback} from 'react'
import {useParams} from 'react-router-dom'
import { Card, CardDeck, Container, Row, Col, Button, Form, Alert, Modal, ModalBody, Image } from 'react-bootstrap'
import firebase, {auth, storage} from '../firebase-config'
import {useDropzone} from 'react-dropzone'
import '../CSS/LeaguePages.css'

const passwordReducer = (state, action) => {
    switch(action.type) {
        case 'changePassword':
            return {...state, changePassword: !state.changePassword};
        case 'setOldPassword':
            return {...state, oldPassword: action.password};
        case 'setFirstNewPassword':
            return {...state, unmatched: action.unmatched, firstNewPassword: action.password};
        case 'setSecondNewPassword':
            return {...state, unmatched: action.unmatched, secondNewPassword: action.password};
        case 'setFlags':
            return {...state, unmatched: action.unmatched && true, incorrect: action.incorrect || false, success: action.success || false, changePassword: action.changePassword};
        case 'reset':
            return action.initState;
        default:
            return {...state};
    }
}

const User = () => {
    const {userid} = useParams();
    const initialState = {oldPassword: "", firstNewPassword: "", secondNewPassword: "", unmatched: true, incorrectPassword: false, success: false, changePassword: false};
    const [state, dispatch] = useReducer(passwordReducer, initialState);
    const [teams, setTeams] = useState([]);
    const [showImageModal, setShowModal] = useState(false);
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
                    for (const [index,team] of data.teams.entries()) {
                        if (team.leagueLogo) {
                            storage.ref(`logos/${team.leagueLogo}`).getDownloadURL().then(url => {
                                setTeams(teams => {
                                const tempTeams = [...teams];
                                tempTeams[index].logoUrl = url;
                                console.log(tempTeams);
                                return tempTeams;
                                });
                            });
                        }
                    }
                }).catch(e => {
                    console.log(e);
                });
            }
        });
        return () => unsub();
    }, [userid]);

    const handlePasswordChange = (e, str) => {
        const unmatched = (str === "First" ? e.target.value !== state.secondNewPassword : e.target.value !== state.firstNewPassword) || e.target.value === "";
        const action = {
            type: "set" + str + "NewPassword",
            password: e.target.value,
            unmatched
        };
        dispatch(action);
    }

    const handlePasswordSubmission = _ => {
        const providedCredential = firebase.auth.EmailAuthProvider.credential(currUser.email, state.oldPassword);
        const errAction = {
            type: "setFlags",
            success: false,
            incorrectPassword: true,
            changePassword: true
        }
        currUser.reauthenticateWithCredential(providedCredential).then(() => {
            currUser.updatePassword(state.firstNewPassword)
            .then(_ => {
                const action = {
                    type: "setFlags",
                    success: true,
                    incorrect: false,
                    changePassword: true
                }
                dispatch(action);
                setTimeout(() => {
                    const action = {
                        type: "reset",
                        initState: initialState
                    };
                    dispatch(action);
                }, 2500);
            }).catch(e => {
                console.log(e);
                dispatch(errAction);
            });
        }).catch(e => {
            console.log(e);
            dispatch(errAction);
        });
		
    }

    const handleImageSubmission = url => {
        const currUser = auth.currentUser;
        storage.ref().child(currUser.email + "/logo").putString(url, "data_url").then(snapshot => {
            snapshot.ref.getDownloadURL().then(url => {
                console.log(url);
                currUser.updateProfile({photoURL: url}).then(() => setShowModal(false))
                .catch(e => console.log(e));
            });
        });
    }
    console.log(currUser);
    return (
        <Container fluid>
        <Col>
            {currUser ? 
                <Row className="justify-content-center mb-3 mt-3">
                    <Image src={currUser.photoURL} className="image-fit-height mr-3" roundedCir></Image>
                    <h1 className="mt-3">
                        {currUser.displayName}
                    </h1>
                </Row>
            : ''}
            {currUser && (userid === currUser.uid) ?
            <>
            <Row className="justify-content-center mb-3">
                <Button onClick={() => dispatch({type: 'changePassword'})}>Change Password</Button>
            </Row>
            <Row className="justify-content-center mb-3">
                <Button onClick={() => setShowModal(true)}>Change/Set User Image</Button>
            </Row>
            </>
            : ''}
            {currUser?
                <>
                    <PasswordModal changePassword={state.changePassword} unmatched={state.unmatched} 
                    incorrectPassword={state.incorrect} success={state.success} handlePasswordChange={handlePasswordChange} 
                    setOldPassword={val => dispatch({type: 'setOldPassword', password: val})} handlePasswordSubmission={handlePasswordSubmission}
                    handleHide={() => dispatch({type: 'changePassword'})}></PasswordModal>
                    
                    <ImageModal showImage={showImageModal} handleHide={() => setShowModal(!showImageModal)} handleImageSubmission={handleImageSubmission}></ImageModal>
                </>
            : ''}
            <Row className="justify-content-center">
                <CardDeck id="teamCards">
                {teams.map((team, index) => {
                    return (
                    <Card key={index} className="m-2">
                        <Card.Body className="d-flex flex-column align-content-end">
                            <a href={'/league/' + team.league + '/team/' + team._id + '/'}>
                                <Card.Img variant="bottom" className="mt-auto" src={team.logoUrl ? team.logoUrl : team.logo}></Card.Img>
                            </a>
                            <div className="mt-auto">
                                <Card.Title>
                                    {team.name}
                                </Card.Title>
                                <Card.Text>
                                    {team.leagueName}
                                </Card.Text>
                                <Button className="mt-auto" href={'/league/' + team.league + '/'}>Go to league</Button>
                            </div>
                        </Card.Body>
                        {team.isCommissioner ? <Card.Footer>Commissioner</Card.Footer> : ''}
                    </Card>);
                    })}
                </CardDeck>
            </Row>
        </Col>
        </Container>
    );
}

const ImageModal = (props) => {
    const [imageUrl, setImageUrl] = useState(null);
    const onDrop = useCallback(acceptedFiles => {
        const reader = new FileReader();
        reader.onload = (url => {
            setImageUrl(url.target.result);
        });
        reader.readAsDataURL(acceptedFiles[0]);
    }, []);

    const {getRootProps, getInputProps} = useDropzone({onDrop});
    return (
        <Modal show={props.showImage} onHide={props.handleHide}>
            <Modal.Header>
                <Modal.Title>
                    Set User Image
                </Modal.Title>
            </Modal.Header>
            <ModalBody>
            <Row className="mb-3">
                <div {...getRootProps({className : 'dropzone'})}>
                    <input {...getInputProps()}/>
                    Select or drop image here
                </div>
            </Row>
            <Row className="justify-content-center">
                <Image className="image-fit" src={imageUrl}></Image>
            </Row>
            </ModalBody>
            <Modal.Footer className="d-flex justify-content-start">
                <Button variant="success" onClick={() => props.handleImageSubmission(imageUrl)}>Submit User Image</Button>
            </Modal.Footer>
        </Modal>
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
                    <Form.Control type="password" onChange={e => props.handlePasswordChange(e, "First")}></Form.Control>
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column>Retype New Password:</Form.Label>
                <Col>
                    <Form.Control type="password" onChange={e => props.handlePasswordChange(e, "Second")}></Form.Control>
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
                <Button disabled={props.unmatched} variant="success" onClick={() => props.handlePasswordSubmission}>Submit New Password</Button>
            </Modal.Footer>
        </Modal>
    );
}

export default User;
