import {
  Row,
  Col,
  Button,
  Form,
  Alert,
  Modal,
  ModalBody,
} from "react-bootstrap";

const PasswordModal = (props) => {
  return (
    <Modal show={props.changePassword} onHide={props.handleHide}>
      <Modal.Header>
        <Modal.Title>
          Change Password
          <div className="subtitle">
            If you used Google to sign in, this option will do nothing.
          </div>
          <div className="subtitle">
            Password must be at least six characters.
          </div>
        </Modal.Title>
      </Modal.Header>
      <ModalBody>
        <Form.Group as={Row}>
          <Form.Label column>Old Password:</Form.Label>
          <Col>
            <Form.Control
              type="password"
              onChange={(e) => props.setOldPassword(e.target.value)}
            ></Form.Control>
          </Col>
        </Form.Group>
        <Form.Group as={Row}>
          <Form.Label column>New Password:</Form.Label>
          <Col>
            <Form.Control
              type="password"
              onChange={(e) => props.handlePasswordChange(e, "First")}
            ></Form.Control>
          </Col>
        </Form.Group>
        <Form.Group as={Row}>
          <Form.Label column>Retype New Password:</Form.Label>
          <Col>
            <Form.Control
              type="password"
              onChange={(e) => props.handlePasswordChange(e, "Second")}
            ></Form.Control>
          </Col>
        </Form.Group>
        {props.unmatched ? (
          <Row>
            <Col>
              <Alert variant="danger">New passwords must match exactly.</Alert>
            </Col>
          </Row>
        ) : (
          ""
        )}
        {props.incorrectPassword ? (
          <Row>
            <Col>
              <Alert variant="danger">
                Incorrect previous password entered.
              </Alert>
            </Col>
          </Row>
        ) : (
          ""
        )}
        {props.success ? (
          <Row>
            <Col>
              <Alert variant="success">Successfully updated password!</Alert>
            </Col>
          </Row>
        ) : (
          ""
        )}
      </ModalBody>
      <Modal.Footer>
        <Button
          disabled={props.unmatched}
          variant="success"
          onClick={() => props.handlePasswordSubmission}
        >
          Submit New Password
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PasswordModal;
