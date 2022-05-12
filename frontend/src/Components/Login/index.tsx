import React, { useEffect } from "react";
import { Row, Container } from "react-bootstrap";
import { ui, uiConfig } from "../../firebase-config";
import "firebase/auth";

const Login = () => {
  useEffect(() => {
    ui.start("#firebaseui-auth-container", uiConfig);
  }, []);
  return (
    <Container>
      <Row className="justify-content-center mt-3">
        <h1>Login/Signup</h1>
      </Row>
      <Row className="justify-content-center mt-3 mb-3">
        <div className="subtitle">
          Use the buttons below to authenticate. If you don&apos;t have an
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
