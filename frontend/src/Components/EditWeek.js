import { Row, Form, Col } from "react-bootstrap";

const EditWeek = (props) => {
  const { week, onChange } = props;
  return (
    <Row className="mt-3 mb-3 align-items-center">
      <Col sm="auto">
        <Form.Label>Week:</Form.Label>
      </Col>
      <Col sm="auto">
        <Form.Control
          as="select"
          defaultValue={week}
          onChange={(e) => onChange(e)}
        >
          {[...Array(17)].map((_, i) => {
            return (
              <option value={i + 1} key={i}>
                {i + 1}
              </option>
            );
          })}
        </Form.Control>
      </Col>
    </Row>
  );
};

export default EditWeek;
