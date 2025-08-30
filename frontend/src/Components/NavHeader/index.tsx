import { useAuthUser } from "@react-query-firebase/auth";
import { Navbar } from "react-bootstrap";
import { auth } from "../../firebase-config";
import { LogOutButtons } from "./LogOutButtons";
import { LoginButtons } from "./LoginButtons";

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
          src={`${import.meta.env.VITE_DEFAULT_LOGO}`}
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

export default NavHeader;
