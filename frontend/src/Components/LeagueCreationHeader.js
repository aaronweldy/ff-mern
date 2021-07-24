import React from "react";
import { Row, Form, Col, DropdownButton, Dropdown } from "react-bootstrap";

const LeagueCreationHeader = (props) => {
  const {
    leagueName,
    setLeagueName,
    handleSizeChange,
    numTeams,
    numWeeks,
    handleTeamSizeChanges,
  } = props;
  return (
    <>
      <Row className="align-items-center mt-5">
        <Col sm="auto">
          <Form.Label>League Name:</Form.Label>
        </Col>
        <Col sm={6}>
          <Form.Control
            placeholder="My Fantasy League"
            defaultValue={leagueName}
            onChange={(e) => setLeagueName(e.target.value)}
          />
        </Col>
      </Row>
      {handleTeamSizeChanges && (
        <Row className="align-items-center">
          <Col>
            <Form.Label>Select number of teams:</Form.Label>
          </Col>

          <Col>
            <DropdownButton
              variant="primary"
              className="m-3"
              name="teams"
              title={numTeams}
              defaultValue={numTeams || 0}
              onSelect={(key) => handleSizeChange(key, "teams")}
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
            name="weeks"
            title={numWeeks}
            defaultValue={numWeeks || 0}
            onSelect={(key) => handleSizeChange(key, "weeks")}
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
