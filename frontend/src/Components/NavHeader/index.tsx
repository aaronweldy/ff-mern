import React, { useEffect, useState } from "react";
import { Navbar, Button } from "react-bootstrap";
import { Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { selectStatus, logout } from "../../Redux/userSlice";
import { auth } from "../../firebase-config";
import { useAuthUser } from "@react-query-firebase/auth";

const NavHeader = () => {
  const userQuery = useAuthUser("user", auth);
  const buttons =
    userQuery.isSuccess && userQuery.data ? (
      <LogOutButtons />
    ) : (
      <LoginButtons />
    );
  return (
    <Navbar bg="dark" expand="lg" variant="dark">
      <Navbar.Brand href="/">
        <img
          src={`${process.env.REACT_APP_DEFAULT_LOGO}`}
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
  const [username, setUsername] = useState("");
  const [redirect, setRedirect] = useState(false);
  const user = auth.currentUser;
  useEffect(() => {
    const authFunc = auth.onAuthStateChanged((newUser) => {
      if (newUser) {
        setUsername(newUser.email ?? "");
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
        setRedirect(true);
      })
      .catch((e) => console.log(e));
  }

  if (redirect) {
    return <Navigate to="/login/" />;
  }
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

export default NavHeader;
