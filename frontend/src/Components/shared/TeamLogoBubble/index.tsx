import { AbbreviatedNflTeam, AbbreviationToFullTeam } from "@ff-mern/ff-types";
import { StableImage } from "../StableImage";
import "./style.css";

type TeamLogoBubbleProps = {
  team: AbbreviatedNflTeam | "None";
};

export const TeamLogoBubble = ({ team }: TeamLogoBubbleProps) => (
  <div className="team-logo-bubble">
    <StableImage
      size="bubble"
      src={`/logos/${
        team !== "None" && AbbreviationToFullTeam[team]
          ? AbbreviationToFullTeam[team].replace(/ /g, "-")
          : "league-logo"
      }.png`}
      alt={team}
    />
  </div>
);
