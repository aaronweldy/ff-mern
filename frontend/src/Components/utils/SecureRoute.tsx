import React from "react";
import { Route, Redirect } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectStatus } from "../../Redux/userSlice";

const SecureRoute = ({ ...routeProps }) => {
  const loggedIn = useSelector(selectStatus);
  if (!loggedIn) {
    return <Redirect to="/login/" />;
  }
  return <Route {...routeProps} />;
};

export default SecureRoute;
