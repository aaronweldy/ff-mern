import React, { useState } from 'react';
import { Redirect } from 'react-router-dom'
import { Col, Alert, Form, Button } from 'react-bootstrap'
import {useSelector, useDispatch} from 'react-redux'
import {selectStatus, login, setUser } from '../Redux/userSlice.js'

const CreateAccount = () => {
    const loggedIn = useSelector(selectStatus);
    const dispatch = useDispatch();
    const [submitted, setSubmitted] = useState(false);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    async function handleSignup(e) {
        e.preventDefault();
        const reqbody = {
            "username" : username, 
            "email" : email,
            "password" : password
        };
        const reqdict = {
            method : 'POST', 
            headers : {'content-type' : 'application/json'},
            body : JSON.stringify(reqbody)
        };
        await fetch("/api/v1/user/signup/", reqdict).then(resp => {
            if (!resp.ok) throw Error(resp.statusText);
            return resp.json();
        }).then(data => {
            localStorage.setItem('userToken', data.token);
            localStorage.setItem('refreshToken', data.refreshToken);
            fetch('/api/v1/user/me/', {
                credentials : "include",
                headers : {
                    'content-type' : 'application/json', 'token' : localStorage.getItem('userToken')}
                }).then((res) => {
                    if (!res.ok) throw Error(res.statusText);
                    return res.json();
                }).then((data) => {
                    dispatch(setUser({id: data._id, username: data.username}));
                }).catch((e) => console.log(e));
            dispatch(login());
        }).catch(_ => {
            setSubmitted(true);
        });
    }
    if (loggedIn) {
        return <Redirect to="/"></Redirect>
    }
    return (
        <Form>
            <Form.Group>
                <Form.Label column sm="2">Username</Form.Label>
                <Col sm="6">
                    <Form.Control onChange={(e) => setUsername(e.target.value)} type="text" placeholder="Example Username"></Form.Control>
                </Col>
            </Form.Group>
            <Form.Group>
                <Form.Label column sm="2">Email address</Form.Label>
                <Col sm="6">
                    <Form.Control onChange={(e) => setEmail(e.target.value)} type="email" placeholder="example@email.com"></Form.Control>
                </Col>
            </Form.Group>
            <Form.Group>
                <Form.Label column sm="2">Password</Form.Label>
                <Col sm="6">
                    <Form.Control onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password"></Form.Control>
                </Col>
            </Form.Group>
            <Form.Group>
                <Col sm="2">
                    <Button onClick={handleSignup} type="submit">Create Account</Button>
                </Col>
            </Form.Group>
            <Form.Group>
                <Col sm="6">
                    {submitted  ? <Alert variant="danger">Incorrect username or password. Please try again.</Alert> : ''}
                </Col>
            </Form.Group>
        </Form>
    );
}
export default CreateAccount;