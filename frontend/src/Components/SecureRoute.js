import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectStatus } from '../Redux/userSlice.js';

const SecureRoute = ({ component: Component, ...rest }) => {
  const loggedIn = useSelector(selectStatus);
  if (!loggedIn) return <Redirect to="/login/" />;
  return (
    <Route
      {...rest}
      component={(props) => <Component {...rest} {...props} />}
    />
  );
};

export default SecureRoute;
