import { Col, Image } from "react-bootstrap";

type LeagueNameProps = {
  leagueName?: string;
  imgUrl?: string;
};

export const LeagueName = ({ leagueName, imgUrl }: LeagueNameProps) => (
  <>
    {imgUrl ? <Image className="image-fit-height" src={imgUrl} rounded /> : ""}
    <Col sm="auto">
      <h1>{leagueName}</h1>
    </Col>
  </>
);
