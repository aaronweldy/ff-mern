import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Row, Container } from "react-bootstrap";
import { login } from "../Redux/userSlice.js";
import { auth, ui, uiConfig } from "../firebase-config";
import "firebase/auth";

const Login = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    ui.start("#firebaseui-auth-container", uiConfig);
    const authFunc = auth.onAuthStateChanged((user) => {
      if (user) {
        dispatch(login());
      } else {
        console.log(user);
      }
    });
    return () => authFunc();
  }, [dispatch]);
  return (
    <Container>
      <Row className="justify-content-center mt-3">
        <h1>Login/Signup</h1>
      </Row>
      <Row className="justify-content-center mt-3 mb-3">
        <div className="subtitle">
          Use the buttons below to authenticate. If you don&apost have an
          account, follow the steps as a sign-in process.
        </div>
        <div className="subtitle">
          If creating a new account, password must be at least six characters.
        </div>
      </Row>
      <div id="firebaseui-auth-container" />
      <div id="loader">Loading...</div>
    </Container>
  );
};

export default Login;
