import { Team } from "@ff-mern/ff-types";
import React from "react";
import { Form } from "react-bootstrap";

type TeamSelectionDropdownProps = {
  teams: Team[];
  selectedTeam?: string;
  updateTeam: (e: React.ChangeEvent<HTMLSelectElement>) => void;
};

export const TeamSelectionDropdown = ({
  teams,
  selectedTeam,
  updateTeam,
}: TeamSelectionDropdownProps) => {
  return (
    <Form.Control as="select" value={selectedTeam} onChange={updateTeam}>
      {teams.map((team) => (
        <option key={team.id} value={team.id}>
          {team.name}
        </option>
      ))}
    </Form.Control>
  );
};
