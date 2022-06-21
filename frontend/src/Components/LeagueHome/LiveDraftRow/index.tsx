import { DraftState } from "@ff-mern/ff-types";
import { Row, Col, Button } from "react-bootstrap";

type LiveDraftRowProps = {
  liveDraftExists: boolean;
  draft: DraftState | null;
  userIsCommissioner: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

export const LiveDraftRow = ({
  liveDraftExists,
  draft,
  userIsCommissioner,
  onEdit,
  onDelete,
}: LiveDraftRowProps) => {
  return (
    <Row className="justify-content-center">
      {liveDraftExists && draft && (
        <Col xl={6} className="join-draft-row">
          <Row className="align-items-center mx-0 justify-between">
            <div>
              <b>Your league is drafting now!</b>
            </div>
            <Col className="d-flex justify-content-end">
              {userIsCommissioner && draft.phase === "predraft" && (
                <>
                  <Button variant="danger" onClick={onDelete}>
                    Delete Draft
                  </Button>
                  <Button className="mx-3" onClick={onEdit}>
                    Edit Draft Settings
                  </Button>
                </>
              )}
              <Button href={`/draft/${draft.settings.draftId}/`}>
                Join Draft
              </Button>
            </Col>
          </Row>
        </Col>
      )}
    </Row>
  );
};
