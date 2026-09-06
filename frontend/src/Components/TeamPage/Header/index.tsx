import { Team } from "@ff-mern/ff-types";
import { Col, Row } from "react-bootstrap";
import { StableImage } from "../../shared/StableImage";

type HeaderProps = {
  team: Team;
  showModal: (arg: boolean) => void;
};

export const Header = ({ team, showModal }: HeaderProps) => {
  return (
    <Row className="mt-3 mb-3">
      <Col sm="auto" className="mt-1">
        <StableImage
          size="logo"
          src={team.logo || import.meta.env.VITE_DEFAULT_LOGO}
          alt="Team logo"
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
