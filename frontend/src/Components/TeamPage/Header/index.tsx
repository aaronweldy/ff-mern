import { Team } from "@ff-mern/ff-types";
import { Row, Col, Image } from "react-bootstrap";

type HeaderProps = {
  team: Team;
  showModal: (arg: boolean) => void;
};

export const Header = ({ team, showModal }: HeaderProps) => {
  return (
    <Row className="mt-3 mb-3">
      <Col sm="auto" className="mt-1">
        <Image
          className="image-fit-height"
          src={team.logo || process.env.REACT_APP_DEFAULT_LOGO}
        />
      </Col>
      <Col sm="auto">
        <h1>
          {team.name}
          <div className="subtitle mb-3">{team.ownerName}</div>
        </h1>
      </Col>
    </Row>
  );
};
