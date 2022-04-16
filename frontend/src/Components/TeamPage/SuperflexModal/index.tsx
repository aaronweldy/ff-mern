import { LineupSettings, Position } from "@ff-mern/ff-types";
import { useMemo, useState } from "react";
import {
  Button,
  Form,
  Modal,
  ToggleButton,
  ToggleButtonGroup,
} from "react-bootstrap";
import { FaUndo } from "react-icons/fa";

type SuperflexModalProps = {
  show: boolean;
  leagueLineupSettings: LineupSettings;
  handleHide: () => void;
  handleSubmit: (addedPos: Position | "None", removedPos: Position) => void;
};

const validSuperflexPositions: Position[] = ["WR", "RB", "TE"];

export const SuperflexModal = ({
  show,
  leagueLineupSettings,
  handleHide,
  handleSubmit,
}: SuperflexModalProps) => {
  const [addedPos, setAddedPos] = useState<Position>();
  const [removedPos, setRemovedPos] = useState<Position>();

  const handleAddedPosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddedPos(e.target.value as Position);
  };

  const handleRemovedPosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRemovedPos(e.target.value as Position);
  };

  const validRemovablePositions = useMemo(() => {
    return validSuperflexPositions.filter((pos) => {
      const offset = addedPos === pos ? 1 : 0;
      return pos !== addedPos && leagueLineupSettings[pos] + offset > 1;
    });
  }, [addedPos, leagueLineupSettings]);

  return (
    <Modal show={show} onHide={handleHide}>
      <Modal.Header closeButton>
        <Modal.Title>Superflex</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Button
          className="mb-3"
          onClick={() => handleSubmit("None", "K")}
          variant="outline-dark"
        >
          <FaUndo className="mb-1" /> {"  "}
          Reset to default
        </Button>
        <Form>
          <Form.Group>
            <Form.Label>Add Position</Form.Label>
            <ToggleButtonGroup type="radio" name="addPosition" className="ml-5">
              {validSuperflexPositions.map((pos) => (
                <ToggleButton
                  value={pos}
                  key={pos}
                  variant="outline-primary"
                  checked={addedPos === pos}
                  onChange={handleAddedPosChange}
                >
                  {pos}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Form.Group>
          <Form.Group>
            <Form.Label>Remove Position</Form.Label>
            <ToggleButtonGroup
              type="radio"
              name="removePosition"
              className="ml-4"
            >
              {validRemovablePositions.map((pos) => (
                <ToggleButton
                  value={pos}
                  key={pos}
                  variant="outline-primary"
                  checked={removedPos === pos}
                  onChange={handleRemovedPosChange}
                >
                  {pos}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleHide}>
          Close
        </Button>
        <Button
          variant="primary"
          disabled={
            !addedPos ||
            !removedPos ||
            !validRemovablePositions.find((pos) => pos === removedPos)
          }
          onClick={() =>
            addedPos && removedPos && handleSubmit(addedPos, removedPos)
          }
        >
          Submit
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
