import { AbbreviatedNflTeam, AbbreviationToFullTeam } from "@ff-mern/ff-types";

type InlineTeamTileProps = {
  team: AbbreviatedNflTeam | "BYE" | "None";
  showName?: boolean;
};

export const InlineTeamTile = ({ team, showName = true }: InlineTeamTileProps) => {
  const strippedTeam = team.replace("@", "") as AbbreviatedNflTeam | "BYE";
  return (
    <span className="spaced-span">
      <img
        className="logo-image"
        src={`/logos/${strippedTeam !== "BYE" && AbbreviationToFullTeam[strippedTeam]
            ? AbbreviationToFullTeam[strippedTeam].replace(/ /g, "-")
            : "league-logo"
          }.png `}
        alt={strippedTeam}
      />
      {showName && team}
    </span>
  );
};
