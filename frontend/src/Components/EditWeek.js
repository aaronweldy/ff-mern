import React from "react";
import { Row, Form, Col } from "react-bootstrap";

const EditWeek = (props) => {
  const { week, maxWeeks, onChange } = props;
  return (
    <Row className="mt-3 mb-3 align-items-center">
      <Col sm="auto">
        <Form.Label>Week:</Form.Label>
      </Col>
      <Col sm="auto">
        <Form.Control as="select" value={week} onChange={onChange}>
          {[...Array(maxWeeks || 18)].map((_, i) => (
            <option value={i + 1} key={i}>
              {i + 1}
            </option>
          ))}
        </Form.Control>
      </Col>
    </Row>
  );
};

export default EditWeek;
