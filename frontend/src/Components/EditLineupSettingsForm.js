import React from "react";
import { Form, Row, Col } from "react-bootstrap";
import { positionTypes } from "../constants";

const EditLineupSettingsForm = (props) => {
  const { handleChange, positionSettings } = props;
  return (
    <>
      <h4>Lineup Settings</h4>
      {positionTypes.map((type, i) => (
        <Form.Group key={i} as={Row} md={6}>
          <Col>
            <Form.Label md={2}>{type}:</Form.Label>
          </Col>
          <Col md={1}>
            <Form.Control
              data-id={i}
              name={type}
              onChange={handleChange}
              value={positionSettings[type] || 0}
              size="md"
              type="text"
            />
          </Col>
        </Form.Group>
      ))}
    </>
  );
};

export default EditLineupSettingsForm;
