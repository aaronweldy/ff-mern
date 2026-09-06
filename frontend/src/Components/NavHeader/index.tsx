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
    <Navbar bg="dark" expand="lg" variant="dark">
      <Navbar.Brand href="/">
        <StableImage
          size="nav"
          src={`${import.meta.env.VITE_DEFAULT_LOGO}`}
          alt="League logo"
          frameClassName="mr-2"
        />
        Orca Fantasy
      </Navbar.Brand>
      {buttons}
    </Navbar>
  );
};

export default NavHeader;
