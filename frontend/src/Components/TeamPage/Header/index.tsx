import { Team } from "@ff-mern/ff-types";
import { Col, Row } from "react-bootstrap";
import { StableImage } from "../../shared/StableImage";

type HeaderProps = {
  team: Team;
};

export const Header = ({ team }: HeaderProps) => {
  return (
    <Row className="mt-3 mb-3 page-identity align-items-center">
      <Col xs="auto">
        <StableImage
          size="logo"
          src={team.logo || import.meta.env.VITE_DEFAULT_LOGO}
          alt="Team logo"
        />
      </Col>
      <Col>
        <h1>{team.name}</h1>
        <div className="subtitle">{team.ownerName}</div>
      </Col>
    </Row>
  );
};
