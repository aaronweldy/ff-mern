import { Col } from "react-bootstrap";
import { StableImage } from "../../shared/StableImage";

type LeagueNameProps = {
  leagueName?: string;
  imgUrl?: string;
};

export const LeagueName = ({ leagueName, imgUrl }: LeagueNameProps) => (
  <>
    <StableImage
      size="logo"
      src={imgUrl}
      alt="League logo"
      className="rounded"
    />
    <Col sm="auto">
      <h1>{leagueName}</h1>
    </Col>
  </>
);
