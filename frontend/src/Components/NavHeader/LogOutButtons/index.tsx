import { auth } from "../../../firebase-config";
import { useState } from "react";
import { Navbar, Button, NavDropdown } from "react-bootstrap";
import { Navigate } from "react-router-dom";
import { useAuthUser } from "@react-query-firebase/auth";
import { useTeamsByUser } from "../../../hooks/query/useTeamsByUser";
import "../CSS/index.css";

export const LogOutButtons = () => {
  const [redirect, setRedirect] = useState(false);
  const user = useAuthUser("user", auth);
  const teamsQuery = useTeamsByUser(user.data?.uid);

  function handleClick() {
    setRedirect(true);
    auth.signOut();
  }

  if (redirect) {
    return <Navigate to="/login/" />;
  }
  return (
    <>
      <Navbar.Collapse>
        <NavDropdown
          id="teamsDropdown"
          title={<span className="dropdown-text">My Teams</span>}
        >
          {teamsQuery.isSuccess &&
            teamsQuery.data?.teams.map((team) => (
              <NavDropdown.Item
                href={`/league/${team.league}/team/${team.id}/`}
                key={team.id}
                className="dropdown-box"
              >
                <span className="mr-4 team-name">{team.name}</span>
                <span className="ml-auto">{team.leagueName}</span>
              </NavDropdown.Item>
            ))}
        </NavDropdown>
      </Navbar.Collapse>
      <Navbar.Collapse className="justify-content-end">
        <Navbar.Text className="mr-3">
          Welcome
          {user.isSuccess ? (
            <a href={`/user/${user.data?.uid}/`}> {user.data?.email}!</a>
          ) : (
            "!"
          )}
        </Navbar.Text>
        {user && user.data?.photoURL ? (
          <img
            src={user.data?.photoURL}
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
    </>
  );
};
