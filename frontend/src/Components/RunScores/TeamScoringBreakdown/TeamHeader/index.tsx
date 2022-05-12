import { Row, Col, Image } from "react-bootstrap";

type HeaderProps = {
  name: string;
  logo: string;
  owner: string;
};

export const TeamHeader = ({ name, logo, owner }: HeaderProps) => (
  <Row className="mb-3 align-items-center">
    <Col sm="auto">
      <Image
        className="image-fit-height"
        src={logo || process.env.REACT_APP_DEFAULT_LOGO}
      />
    </Col>
    <Col sm="auto" className="align-items-center">
      <h3>{name}</h3>
      <div className="subtitle">{owner}</div>
    </Col>
  </Row>
);
