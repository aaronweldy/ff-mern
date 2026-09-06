import { Col, Row } from "react-bootstrap";
import { StableImage } from "../../../shared/StableImage";

type HeaderProps = {
  name: string;
  logo: string;
  owner: string;
};

export const TeamHeader = ({ name, logo, owner }: HeaderProps) => (
  <Row className="mb-3 align-items-center">
    <Col sm="auto">
      <StableImage
        size="logo"
        src={logo || import.meta.env.VITE_DEFAULT_LOGO}
        alt="Team logo"
      />
    </Col>
    <Col sm="auto" className="align-items-center">
      <h3>{name}</h3>
      <div className="subtitle">{owner}</div>
    </Col>
  </Row>
);
