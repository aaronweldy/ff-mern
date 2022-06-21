import {
  DraftState,
  getNumPlayersFromLineupSettings,
  League,
  PickOrder,
  SimplifiedTeamInfo,
  Team,
} from "@ff-mern/ff-types";
import { useEffect, useMemo } from "react";
import { Button, Col, Form, Modal, Row } from "react-bootstrap";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Controller, useForm } from "react-hook-form";
import { useParams } from "react-router-dom";
import { useTeams } from "../../../hooks/query/useTeams";
import { DraggableList } from "./DraggableList";

type CreateDraftModalProps = {
  league: League;
  show: boolean;
  onHide: () => void;
  onConfirm: (state: DraftFormState) => void;
  existingDraft?: DraftState;
};

export type DraftFormState = {
  numRounds: number;
  pickOrder: PickOrder;
  draftOrder: SimplifiedTeamInfo[];
};

export const CreateDraftModal = ({
  show,
  league,
  onHide,
  onConfirm,
  existingDraft,
}: CreateDraftModalProps) => {
  const { id } = useParams() as { id: string };
  const minimumPlayers = useMemo(
    () => getNumPlayersFromLineupSettings(league.lineupSettings),
    [league]
  );
  const { query: teamQuery } = useTeams(id);
  const { control, handleSubmit, setValue } = useForm<DraftFormState>({
    defaultValues: {
      numRounds: minimumPlayers,
      pickOrder: "snake",
      draftOrder: [],
    },
  });

  useEffect(() => {
    if (teamQuery.isSuccess) {
      if (existingDraft) {
        setValue(
          "draftOrder",
          existingDraft.settings.draftOrder.map((teamId) =>
            Team.generateSimplifiedInfo(
              teamQuery.data.teams.find((team) => team.id === teamId) ||
                ({} as Team)
            )
          )
        );
        setValue("numRounds", existingDraft.settings.numRounds);
        setValue("pickOrder", existingDraft.settings.pickOrder);
      } else {
        setValue(
          "draftOrder",
          teamQuery.data.teams.map((team) => Team.generateSimplifiedInfo(team))
        );
      }
    }
  }, [teamQuery, setValue, existingDraft]);
  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>{existingDraft ? "Edit" : "Create"} Draft</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Row>
            <Col>
              <Form.Label>
                <b>Number of Rounds:</b>
              </Form.Label>
              <Controller
                name="numRounds"
                control={control}
                render={({ field }) => (
                  <Form.Control {...field} type="number" min={minimumPlayers} />
                )}
              />
            </Col>
          </Row>

          <Row className="mt-3">
            <Col>
              <Form.Label>
                <b>Draft Type:</b>
              </Form.Label>
              <Controller
                name="pickOrder"
                control={control}
                render={({ field }) => (
                  <Form.Control as="select" {...field}>
                    <option value="snake">Snake</option>
                    <option value="round-robin">Round-Robin</option>
                  </Form.Control>
                )}
              />
            </Col>
          </Row>
          <Row className="mt-3">
            <Col>
              <Form.Label className="my-0">
                <b>Draft Order:</b>
              </Form.Label>
              <Form.Text className="my-0" muted>
                Drag to Reorder
              </Form.Text>
              <Controller
                name="draftOrder"
                control={control}
                render={({ field }) => (
                  <DndProvider backend={HTML5Backend}>
                    <DraggableList {...field} setValue={setValue} />
                  </DndProvider>
                )}
              />
            </Col>
          </Row>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="success" onClick={() => handleSubmit(onConfirm)()}>
          {existingDraft ? "Update Draft" : "Create"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
