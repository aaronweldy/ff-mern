import React from "react";
import {
  Row,
  Col,
  Button,
  Form,
  Alert,
  Modal,
  ModalBody,
} from "react-bootstrap";

type PasswordModalProps = {
  changePassword: boolean;
  unmatched: boolean;
  incorrectPassword: boolean;
  success: boolean;
  handleHide: () => void;
  setOldPassword: (val: string) => void;
  handlePasswordChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    name: string
  ) => void;
  handlePasswordSubmission: () => void;
};

const PasswordModal = ({
  changePassword,
  unmatched,
  incorrectPassword,
  success,
  handleHide,
  setOldPassword,
  handlePasswordChange,
  handlePasswordSubmission,
}: PasswordModalProps) => (
  <Modal show={changePassword} onHide={handleHide}>
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
            onChange={(e) => setOldPassword(e.target.value)}
          />
        </Col>
      </Form.Group>
      <Form.Group as={Row}>
        <Form.Label column>New Password:</Form.Label>
        <Col>
          <Form.Control
            type="password"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handlePasswordChange(e, "First")
            }
          />
        </Col>
      </Form.Group>
      <Form.Group as={Row}>
        <Form.Label column>Retype New Password:</Form.Label>
        <Col>
          <Form.Control
            type="password"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handlePasswordChange(e, "Second")
            }
          />
        </Col>
      </Form.Group>
      {unmatched ? (
        <Row>
          <Col>
            <Alert variant="danger">New passwords must match exactly.</Alert>
          </Col>
        </Row>
      ) : (
        ""
      )}
      {incorrectPassword ? (
        <Row>
          <Col>
            <Alert variant="danger">Incorrect previous password entered.</Alert>
          </Col>
        </Row>
      ) : (
        ""
      )}
      {success ? (
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
        disabled={unmatched}
        variant="success"
        onClick={() => handlePasswordSubmission}
      >
        Submit New Password
      </Button>
    </Modal.Footer>
  </Modal>
);

export default PasswordModal;
