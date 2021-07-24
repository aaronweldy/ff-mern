import { Form } from "react-bootstrap";
import React from "react";

const ScoringSettingCheckGroup = (props) => {
  const { handleClick, scoring } = props;
  return (
    <Form.Group>
      <Form.Check
        type="radio"
        name="scoring-setting"
        value="Standard"
        label="Standard"
        onClick={(e) => handleClick(e.target.value)}
        defaultChecked={scoring === "Standard"}
      />
      <Form.Check
        type="radio"
        name="scoring-setting"
        value="PPR"
        label="PPR"
        onClick={(e) => handleClick(e.target.value)}
        defaultChecked={scoring === "PPR"}
      />
      <Form.Check
        type="radio"
        name="scoring-setting"
        value="Custom"
        label="Custom"
        onClick={(e) => handleClick(e.target.value)}
        defaultChecked={scoring === "Custom"}
      />
    </Form.Group>
  );
};

export default ScoringSettingCheckGroup;
