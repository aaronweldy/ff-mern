import { Modal, Button } from "react-bootstrap";

type ConfirmationModalProps = {
  show: boolean;
  onHide: () => void;
  title: string;
  onConfirm: () => void;
};

export const ConfirmationModal = ({
  show,
  onHide,
  title,
  onConfirm,
}: ConfirmationModalProps) => (
  <Modal show={show} onHide={onHide}>
    <Modal.Header closeButton>
      <Modal.Title>{title}</Modal.Title>
    </Modal.Header>
    <Modal.Body>Are you sure?</Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={onHide}>
        Cancel
      </Button>
      <Button variant="success" onClick={onConfirm}>
        Confirm
      </Button>
    </Modal.Footer>
  </Modal>
);
