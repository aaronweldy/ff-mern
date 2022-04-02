import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthUser } from "@react-query-firebase/auth";
import { auth } from "../../firebase-config";
import { Spinner } from "react-bootstrap";

const SecureRoute = () => {
  const user = useAuthUser(["user"], auth);
  if (user.isLoading) {
    return <Spinner animation="grow" />;
  }
  if (user.isSuccess) {
    return <Outlet />;
  }
  return <Navigate to="/login/" />;
};

export default SecureRoute;
