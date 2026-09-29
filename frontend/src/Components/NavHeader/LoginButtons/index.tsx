import { Button } from "react-bootstrap";

export const LoginButtons = () => {
  return (
    <div className="nav-account-menu ml-lg-auto">
      <Button variant="primary" href="/login/">
        Login or Create Account
      </Button>
    </div>
  );
};
