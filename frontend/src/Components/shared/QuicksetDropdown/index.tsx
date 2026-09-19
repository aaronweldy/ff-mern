import {
  SingleTeamResponse,
  QuicksetRequest,
  Week,
  LineupSettings,
} from "@ff-mern/ff-types";
import { Alert, DropdownButton, Dropdown } from "react-bootstrap";
import { UseMutationResult } from "react-query";

type QuicksetDropdownProps = {
  week: number;
  mutationFn: UseMutationResult<SingleTeamResponse, Error, QuicksetRequest>;
  lineupSettings: LineupSettings;
};

export const QuicksetDropdown = ({
  week,
  mutationFn,
  lineupSettings,
}: QuicksetDropdownProps) => (
  <>
    <DropdownButton
      id="quickset-lineup"
      title={mutationFn.isLoading ? "Setting Lineup…" : "Quick Set Lineup"}
      disabled={mutationFn.isLoading}
    >
      {week > 1 && (
        <Dropdown.Item
          onClick={() =>
            mutationFn.mutate({
              week: week.toString() as Week,
              type: "LastWeek",
              lineupSettings,
            })
          }
        >
          Use Last Week's Lineup
        </Dropdown.Item>
      )}
      <Dropdown.Item
        onClick={() =>
          mutationFn.mutate({
            week: week.toString() as Week,
            type: "Projection",
            lineupSettings,
          })
        }
      >
        Use Highest Projected Lineup
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
