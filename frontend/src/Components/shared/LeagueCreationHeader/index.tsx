import React from "react";
import { Row, Form, Col, DropdownButton, Dropdown } from "react-bootstrap";

type LeagueCreationHeaderProps = {
  leagueName: string;
  setLeagueName: (name: string) => void;
  handleSizeChange: (key: string, name: string) => void;
  numTeams: number;
  numWeeks: number;
  allowTeamSizeChanges?: boolean;
};

const LeagueCreationHeader = ({
  leagueName,
  setLeagueName,
  handleSizeChange,
  numTeams,
  numWeeks,
  allowTeamSizeChanges,
}: LeagueCreationHeaderProps) => {
  return (
    <>
      <Row className="align-items-center">
        <Col sm="auto">
          <Form.Label>League Name:</Form.Label>
        </Col>
        <Col sm={6}>
          <Form.Control
            placeholder="My Fantasy League"
            defaultValue={leagueName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setLeagueName(e.target.value)
            }
          />
        </Col>
      </Row>
      {allowTeamSizeChanges && (
        <Row className="align-items-center">
          <Col>
            <Form.Label>Select number of teams:</Form.Label>
          </Col>

          <Col>
            <DropdownButton
              variant="primary"
              className="m-3"
              title={numTeams}
              defaultValue={numTeams || 0}
              onSelect={(key: string | null) =>
                handleSizeChange(key as string, "teams")
              }
            >
              {[...Array(15)].map((_, i) => (
                <Dropdown.Item key={i} eventKey={i}>
                  {i}
                </Dropdown.Item>
              ))}
            </DropdownButton>
          </Col>
        </Row>
      )}
      <Row className="align-items-center">
        <Col>
          <Form.Label>Number of weeks in season:</Form.Label>
        </Col>
        <Col>
          <DropdownButton
            variant="primary"
            className="m-3"
            title={numWeeks}
            defaultValue={numWeeks || 0}
            onSelect={(key: string | null) =>
              handleSizeChange(key as string, "weeks")
            }
          >
            {[...Array(18)].map((_, i) => (
              <Dropdown.Item key={i} eventKey={i + 1}>
                {i + 1}
              </Dropdown.Item>
            ))}
          </DropdownButton>
        </Col>
      </Row>
    </>
  );
};

export default LeagueCreationHeader;
