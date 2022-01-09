import React from "react";
import { Table, Form, Row, OverlayTrigger, Button, Col } from "react-bootstrap";
import { Team } from "../../ff-types/Team";

type LeagueCreationTableProps = {
  teams: Team[];
  handleChange: (
    e: React.ChangeEvent<HTMLFormElement | HTMLInputElement>,
    id: number,
    name: string,
    isCommissioner?: boolean
  ) => void;
  handleOverlay: (index: number) => void;
};

const LeagueCreationTable = ({
  teams,
  handleChange,
  handleOverlay,
}: LeagueCreationTableProps) => {
  console.log(teams);
  return (
    <Row>
      <Col>
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Team Name</th>
              <th>Team Owner Email</th>
              <th>Commissioner</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team, i) => (
              <OverlayTrigger
                key={i}
                placement="left"
                delay={1000}
                overlay={
                  <Button
                    onClick={() => handleOverlay(i)}
                    name="remove"
                    variant="danger"
                  >
                    X
                  </Button>
                }
              >
                <tr key={i}>
                  <td>
                    <input
                      name="name"
                      data-id={i}
                      type="text"
                      value={team.name}
                      onChange={(e) => handleChange(e, i, "name")}
                    />
                  </td>
                  <td>
                    <input
                      name="ownerName"
                      data-id={i}
                      type="text"
                      value={team.ownerName}
                      onChange={(e) => handleChange(e, i, "ownerName")}
                    />
                  </td>
                  <td>
                    <Form.Check
                      data-id={i}
                      name="isCommissioner"
                      onChange={(e) =>
                        handleChange(
                          e,
                          i,
                          "isCommissioner",
                          !team.isCommissioner
                        )
                      }
                      checked={team.isCommissioner}
                    />
                  </td>
                </tr>
              </OverlayTrigger>
            ))}
          </tbody>
        </Table>
      </Col>
    </Row>
  );
};

export default LeagueCreationTable;
