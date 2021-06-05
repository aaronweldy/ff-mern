import { Button } from "react-bootstrap";
import "../CSS/LeaguePages.css";

export default function LeagueButton(props) {
  return (
    <Button
      className="left-corner"
      href={"/league/" + props.id + "/"}
      variant="primary"
    >
      Back to league home
    </Button>
  );
}
