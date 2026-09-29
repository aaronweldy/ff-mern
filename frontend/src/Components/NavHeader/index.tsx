import { useAuthUser } from "@react-query-firebase/auth";
import { Navbar } from "react-bootstrap";
import { auth } from "../../firebase-config";
import { LogOutButtons } from "./LogOutButtons";
import { LoginButtons } from "./LoginButtons";
import { StableImage } from "../shared/StableImage";

const NavHeader = () => {
  const userQuery = useAuthUser("user", auth);
  const buttons =
    userQuery.isSuccess && userQuery.data ? (
      <LogOutButtons />
    ) : (
      <LoginButtons />
    );
  return (
    <Navbar bg="dark" expand="lg" variant="dark" className="app-navbar">
      <Navbar.Brand href="/">
        <StableImage
          size="nav"
          src={`${import.meta.env.VITE_DEFAULT_LOGO}`}
          alt="League logo"
          frameClassName="mr-2"
        />
        Orca Fantasy
      </Navbar.Brand>
      <Navbar.Toggle
        aria-controls="app-navigation"
        aria-label="Toggle navigation"
      />
      <Navbar.Collapse id="app-navigation">{buttons}</Navbar.Collapse>
    </Navbar>
  );
};

export default NavHeader;
