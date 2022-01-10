import React from "react";
import { Form, Row, Col } from "react-bootstrap";
import { Position, PositionInfo, positionTypes } from "@ff-mern/ff-types";

type LineupSettingsProps = {
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    name: Position
  ) => void;
  positionSettings: PositionInfo;
};

const EditLineupSettingsForm = ({
  handleChange,
  positionSettings,
}: LineupSettingsProps) => {
  return (
    <>
      <h4>Lineup Settings</h4>
      {positionTypes.map((type: Position, i) => (
        <Form.Group key={i} as={Row} md={6}>
          <Col>
            <Form.Label md={2}>{type}:</Form.Label>
          </Col>
          <Col md={1}>
            <Form.Control
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleChange(e, type)
              }
              value={positionSettings[type] || 0}
              size="sm"
              type="text"
            />
          </Col>
        </Form.Group>
      ))}
    </>
  );
};

export default EditLineupSettingsForm;
