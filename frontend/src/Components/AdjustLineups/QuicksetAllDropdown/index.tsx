import { UpdateAllTeamsResponse } from "@ff-mern/ff-types";
import { DropdownButton, Dropdown } from "react-bootstrap";
import { UseMutationResult } from "react-query";
import { QuicksetAllTeamsRequest } from "../../../hooks/query/useQuicksetAllTeamsMutation";

type QuicksetAllDropdownProps = {
  mutationFn: UseMutationResult<
    UpdateAllTeamsResponse,
    Error,
    QuicksetAllTeamsRequest
  >;
};

export const QuicksetAllDropdown = ({
  mutationFn,
}: QuicksetAllDropdownProps) => {
  return (
    <DropdownButton id="quickset-all-lineups" title="Quick Set All Teams">
      <Dropdown.Item
        onClick={() =>
          mutationFn.mutate({
            type: "LastWeek",
          })
        }
      >
        Use Last Week's Lineups
      </Dropdown.Item>
      <Dropdown.Item
        onClick={() =>
          mutationFn.mutate({
            type: "Projection",
          })
        }
      >
        Use Highest Projected Lineups
      </Dropdown.Item>
    </DropdownButton>
  );
};
