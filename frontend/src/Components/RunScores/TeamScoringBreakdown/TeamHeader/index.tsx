import { Col, Row } from "react-bootstrap";
import { StableImage } from "../../../shared/StableImage";

type HeaderProps = {
  name: string;
  logo: string;
  owner: string;
};

export const TeamHeader = ({ name, logo, owner }: HeaderProps) => (
  <Row className="mb-3 align-items-center page-identity">
    <Col xs="auto">
      <StableImage
        size="logo"
        src={logo || import.meta.env.VITE_DEFAULT_LOGO}
        alt="Team logo"
      />
    </Col>
    <Col className="align-items-center">
      <h2 className="h3">{name}</h2>
      <div className="subtitle">{owner}</div>
    </Col>
  </Row>
);
