import React from "react";
import { ToggleButton, ToggleButtonGroup } from "react-bootstrap";

type StatTypeToggleButtonProps = {
  selected: ScoringToggleType;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export type ScoringToggleType = "statistics" | "scoring";

export const StatTypeToggleButton = ({
  selected,
  onChange,
}: StatTypeToggleButtonProps) => {
  return (
    <ToggleButtonGroup
      type="radio"
      name="statToggleButtons"
      defaultValue={"scoring"}
    >
      <ToggleButton
        id="scoringToggle"
        checked={selected === "scoring"}
        value="scoring"
        onChange={onChange}
      >
        Scoring
      </ToggleButton>
      <ToggleButton
        id="statToggle"
        checked={selected === "statistics"}
        value="statistics"
        onChange={onChange}
      >
        Stats
      </ToggleButton>
    </ToggleButtonGroup>
  );
};
