import { useState } from "react";
import { Modal, Form, Row, Col, Button } from "react-bootstrap";

type LeagueDeletionModalProps = {
  showDelete: boolean;
  setDelete: React.Dispatch<React.SetStateAction<boolean>>;
  deleteLeague: () => void;
  leagueName?: string;
};

export const LeagueDeletionModal = ({
  showDelete,
  setDelete,
  deleteLeague,
  leagueName,
}: LeagueDeletionModalProps) => {
  const [deleteName, setDeleteName] = useState("");
  return (
    <Modal show={showDelete} onHide={() => setDelete(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Delete League</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Type the name of the league to confirm deletion:
        <Form.Group className="mt-3" as={Row}>
          <Col md={6}>
            <Form.Control
              type="text"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setDeleteName(e.target.value)
              }
            />
          </Col>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setDelete(false)}>
          Close
        </Button>
        <Button
          disabled={deleteName !== leagueName}
          variant="danger"
          onClick={deleteLeague}
        >
          Confirm Deletion
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
