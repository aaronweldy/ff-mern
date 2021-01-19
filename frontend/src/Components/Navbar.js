import React from 'react';
import {Navbar, Nav, Button} from 'react-bootstrap'
import {useHistory} from 'react-router-dom'
import {useSelector, useDispatch} from 'react-redux'
import {selectStatus, logout, selectUser} from '../Redux/userSlice.js'

const MainNav = () => {
    const loggedIn = useSelector(selectStatus);
    const buttons = loggedIn ? <LogOutButtons></LogOutButtons> : <LoginButtons></LoginButtons>
    return (
        <Navbar bg="dark" expand="lg" variant="dark">
            <Navbar.Brand href="/">
            <img src={process.env.REACT_APP_PUBLIC_URL + '/orca.jfif'} className="d-inline-block align-top mr-2" width="35" height="35" alt="League logo"></img>
            Orca Fantasy
            </Navbar.Brand>
            {loggedIn ? <Navbar.Collapse className="collapse navbar-collapse" id="navbar-nav">
                <Nav className="navbar-nav mr-auto">
                    <Nav.Link className="nav-item" href="/team/">My Team</Nav.Link>
                </Nav>
            </Navbar.Collapse> : ''}
            {buttons}
        </Navbar>
    );
}

function LoginButtons() {
    return (
        <Navbar.Collapse className="justify-content-end">
            <Button className="mr-3" variant="primary" href="/login/">Login</Button>
            <Button variant="primary" href="/create/">Create an account</Button>
        </Navbar.Collapse>
    );
}

function LogOutButtons() {
    const dispatch = useDispatch();
    const history = useHistory();
    const user = useSelector(selectUser);
    function handleClick(e) {
        e.preventDefault();
        localStorage.removeItem('userToken');
        dispatch(logout());
        history.push('/login/');
    }
    return (<Navbar.Collapse className="justify-content-end">
        <Navbar.Text className="mr-3">
            Welcome, {user.username}!
        </Navbar.Text>
        <Button variant="primary" onClick={handleClick} type="submit">
            Logout
        </Button>
    </Navbar.Collapse>);
}

export default MainNav;