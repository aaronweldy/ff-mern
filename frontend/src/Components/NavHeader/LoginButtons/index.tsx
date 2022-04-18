import { Button, Navbar } from "react-bootstrap";

export const LoginButtons = () => {
  return (
    <Navbar.Collapse className="justify-content-end">
      <Button variant="primary" href="/login/">
        Login or Create Account
      </Button>
    </Navbar.Collapse>
  );
};
