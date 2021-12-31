import { Form } from "react-bootstrap";
import React from "react";

export type ScoringType = "Standard" | "PPR" | "Custom";

type ScoringSettingCheckGroupProps = {
  handleClick: (val: string) => void;
  scoring: ScoringType;
};

const ScoringSettingCheckGroup = ({
  handleClick,
  scoring,
}: ScoringSettingCheckGroupProps) => {
  return (
    <Form.Group>
      <Form.Check
        type="radio"
        name="scoring-setting"
        value="Standard"
        label="Standard"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          handleClick(e.target.value)
        }
        defaultChecked={scoring === "Standard"}
      />
      <Form.Check
        type="radio"
        name="scoring-setting"
        value="PPR"
        label="PPR"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          handleClick(e.target.value)
        }
        defaultChecked={scoring === "PPR"}
      />
      <Form.Check
        type="radio"
        name="scoring-setting"
        value="Custom"
        label="Custom"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          handleClick(e.target.value)
        }
        defaultChecked={scoring === "Custom"}
      />
    </Form.Group>
  );
};

export default ScoringSettingCheckGroup;
