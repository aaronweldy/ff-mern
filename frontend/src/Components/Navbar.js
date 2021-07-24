import React, { useEffect, useState } from "react";
import { Navbar, Button } from "react-bootstrap";
import { Redirect } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { selectStatus, logout } from "../Redux/userSlice.js";
import { auth } from "../firebase-config";

const MainNav = () => {
  const loggedIn = useSelector(selectStatus);
  const buttons = loggedIn ? <LogOutButtons /> : <LoginButtons />;
  return (
    <Navbar bg="dark" expand="lg" variant="dark">
      <Navbar.Brand href="/">
        <img
          src={`${process.env.REACT_APP_PUBLIC_URL}/orca.jfif`}
          className="d-inline-block align-top mr-2"
          width="auto"
          height="35"
          alt="League logo"
        />
        Orca Fantasy
      </Navbar.Brand>
      {buttons}
    </Navbar>
  );
};

function LoginButtons() {
  return (
    <Navbar.Collapse className="justify-content-end">
      <Button variant="primary" href="/login/">
        Login or Create Account
      </Button>
    </Navbar.Collapse>
  );
}

function LogOutButtons() {
  const dispatch = useDispatch();
  const [username, setUsername] = useState("");
  const [redirect, setRedirect] = useState(false);
  const user = auth.currentUser;
  console.log(auth.currentUser);
  useEffect(() => {
    const authFunc = auth.onAuthStateChanged((user) => {
      if (user) {
        setUsername(user.email);
      } else {
        setRedirect(true);
      }
    });
    return () => authFunc();
  }, [user]);

  function handleClick() {
    auth
      .signOut()
      .then(() => {
        dispatch(logout());
        setRedirect(true);
      })
      .catch((e) => console.log(e));
  }

  if (redirect) return <Redirect to="/login/" />;
  return (
    <Navbar.Collapse className="justify-content-end">
      <Navbar.Text className="mr-3">
        Welcome
        {user ? <a href={`/user/${user.uid}/`}> {username}!</a> : "!"}
      </Navbar.Text>
      {user && user.photoURL ? (
        <img
          src={user.photoURL}
          className="d-inline-block align-top mr-3"
          width="auto"
          height="35"
          alt="User logo"
        />
      ) : (
        ""
      )}
      <Button variant="primary" onClick={handleClick} type="submit">
        Logout
      </Button>
    </Navbar.Collapse>
  );
}

export default MainNav;
