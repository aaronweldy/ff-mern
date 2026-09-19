import { UpdateAllTeamsResponse } from "@ff-mern/ff-types";
import { Alert, DropdownButton, Dropdown } from "react-bootstrap";
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
    <>
      <DropdownButton
        id="quickset-all-lineups"
        title={
          mutationFn.isLoading ? "Setting Lineups…" : "Quick Set All Teams"
        }
        disabled={mutationFn.isLoading}
      >
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
      {mutationFn.isError && (
        <Alert variant="danger" className="mt-2" role="alert">
          {mutationFn.error?.message ||
            "Unable to set the lineup. Please try again."}
        </Alert>
      )}
    </>
  );
};
