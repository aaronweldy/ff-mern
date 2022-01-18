import { Team } from "@ff-mern/ff-types";
import { Row, Col, Button, Image } from "react-bootstrap";

type HeaderProps = {
  team: Team;
  isOwner: boolean;
  showModal: (arg: boolean) => void;
};

export const Header = ({ team, isOwner, showModal }: HeaderProps) => {
  return (
    <Row className="mt-3 mb-3">
      <Col sm="auto">
        <Image
          className="image-fit-height"
          src={team.logo || process.env.REACT_APP_DEFAULT_LOGO}
        />
      </Col>
      <Col sm="auto">
        <h1 className="mt-2">
          {team.name}
          <div className="subtitle mb-3 mt-2">{team.ownerName}</div>
        </h1>
      </Col>
      {isOwner ? (
        <Col className="mt-3">
          <Button onClick={() => showModal(true)}>Change/Set Team Logo</Button>
        </Col>
      ) : null}
    </Row>
  );
};
