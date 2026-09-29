import { StableImage } from "../../../shared/StableImage";

type HeaderProps = {
  name: string;
  logo: string;
  owner: string;
};

export const TeamHeader = ({ name, logo, owner }: HeaderProps) => (
  <div className="mb-3 page-identity score-team-identity">
    <StableImage
      size="logo"
      src={logo || import.meta.env.VITE_DEFAULT_LOGO}
      alt="Team logo"
    />
    <div className="score-team-copy">
      <h2 className="h3">{name}</h2>
      <div className="subtitle">{owner}</div>
    </div>
  </div>
);
