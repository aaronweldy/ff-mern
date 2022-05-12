import { Button } from "react-bootstrap";

type CommissionerOptionsProps = {
  leagueId: string;
  setDelete: React.Dispatch<React.SetStateAction<boolean>>;
};

export const CommissionerOptions = ({
  leagueId,
  setDelete,
}: CommissionerOptionsProps) => (
  <div>
    <a href={`/league/${leagueId}/editTeams/`}>Edit Teams</a> |{" "}
    <a href={`/league/${leagueId}/editScoringSettings/`}> Edit Scoring</a> |{" "}
    <a href={`/league/${leagueId}/addPoints/`}> Adjust Weekly Scores</a> |
    <a href={`/league/${leagueId}/adjustLineups/`}> Adjust Starting Lineups</a>{" "}
    | <a href={`/league/${leagueId}/updateSettings/`}>Adjust Settings</a> |{" "}
    <Button
      className="ml-1 mb-1"
      id="inline-button"
      variant="link"
      onClick={() => setDelete(true)}
    >
      {" "}
      Delete League
    </Button>
  </div>
);
