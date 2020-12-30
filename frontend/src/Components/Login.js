import React, { useState } from 'react'
import {useSelector, useDispatch} from 'react-redux'
import {Redirect} from 'react-router-dom'
import {selectStatus, login, setUser} from '../Redux/userSlice.js'
import {Form, Button, Col, Alert} from 'react-bootstrap'

const Login = () => {
    const loggedIn = useSelector(selectStatus);
    const dispatch = useDispatch();
    const [submitted, setSubmitted] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    async function handleLogin(e) {
        e.preventDefault();
        const body = {
          "email": email,
          "password": password
        };
        const reqdict = {
          method : 'POST', 
          headers : {'content-type' : 'application/json'},
          body : JSON.stringify(body)
        };
        let resp = await fetch("/api/v1/user/login/", reqdict);
        let json = await resp.json();
        localStorage.setItem("userToken", json.token);
        dispatch(login());
        setSubmitted(true);
        fetch('/api/v1/user/me/', {
            credentials : "include",
            headers : {
                'content-type' : 'application/json', 'token' : localStorage.getItem('userToken')}
            }).then((res) => {
                if (!res.ok) throw Error(res.statusText);
                return res.json();
            }).then((data) => {
                dispatch(setUser(data));
            }).catch((e) => console.log(e));
    }
    if(loggedIn) return <Redirect to="/"></Redirect>;
    return (
        <Form onSubmit={handleLogin}>
            <Form.Group>
                <Form.Label column sm="2">Email address</Form.Label>
                <Col sm="10">
                    <Form.Control onChange={(e) => setEmail(e.target.value)} type="email" placeholder="example@email.com"></Form.Control>
                </Col>
            </Form.Group>
            <Form.Group>
                <Form.Label column sm="2">Password</Form.Label>
                <Col sm="10">
                    <Form.Control onChange={e => setPassword(e.target.value)} type="password" placeholder="Password"></Form.Control>
                </Col>
            </Form.Group>
            <Form.Group>
                <Col sm="2">
                    <Button type="submit">Login</Button>
                </Col>
            </Form.Group>
            <Form.Group>
                <Col sm="8">
                    {submitted  ? <Alert variant="danger">Incorrect username or password. Please try again.</Alert> : ''}
                </Col>
            </Form.Group>
        </Form>
    );
}

export default Login;