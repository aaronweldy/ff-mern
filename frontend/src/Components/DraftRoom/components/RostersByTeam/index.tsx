import { IterablePlayer, lineupToIterable } from "@ff-mern/ff-types";
import { useEffect, useMemo, useState } from "react";
import { Container } from "react-bootstrap";
import { useTeams } from "../../../../hooks/query/useTeams";
import { TeamSelectionDropdown } from "../../../shared/TeamSelectionDropdown";
import { useStore } from "../../store";
import "./style.css";

export const RostersByTeam = () => {
  const { draftState, playersByTeam } = useStore((store) => ({
    draftState: store.state,
    playersByTeam: store.playersByTeam,
  }));
  const { query: teamsQuery } = useTeams(draftState?.leagueId || "");
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const iterableLineups = useMemo(() => {
    return playersByTeam
      ? Object.keys(playersByTeam).reduce<Record<string, IterablePlayer[]>>(
          (acc, cur) => {
            acc[cur] = lineupToIterable(playersByTeam[cur]);
            return acc;
          },
          {}
        )
      : {};
  }, [playersByTeam]);
  useEffect(() => {
    if (teamsQuery.data && !selectedTeam) {
      setSelectedTeam(teamsQuery.data.teams[0].id);
    }
  }, [teamsQuery.data, selectedTeam]);
  const updateSelectedTeam = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTeam(e.target.value);
  };
  if (!playersByTeam || !teamsQuery.isSuccess) {
    return <div>Loading...</div>;
  }
  return (
    <Container className="roster-container mt-3">
      <TeamSelectionDropdown
        teams={teamsQuery.data.teams}
        selectedTeam={selectedTeam}
        updateTeam={updateSelectedTeam}
      />
      <div className="current-roster-box">
        {iterableLineups[selectedTeam] && (
          <div key={selectedTeam}>
            {iterableLineups[selectedTeam].map((player, i) => (
              <div
                className="rostered-player-row"
                key={player.position + i.toString()}
              >
                <div className="rostered-player-position">{player.lineup}</div>
                <div>{player.fullName}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
};
