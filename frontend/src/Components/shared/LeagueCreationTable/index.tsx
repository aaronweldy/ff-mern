import React from "react";
import { Table, Form, Row, Button, Col } from "react-bootstrap";
import { Team } from "@ff-mern/ff-types";

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
  return (
    <Row>
      <Col>
        <Table striped bordered hover className="w-75">
          <thead>
            <tr>
              <th>Team Name</th>
              <th>Team Owner Email</th>
              <th>Commissioner</th>
              <th>Remove Team</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team, i) => (
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
                      handleChange(e, i, "isCommissioner", !team.isCommissioner)
                    }
                    checked={team.isCommissioner}
                  />
                </td>
                <td className="d-flex">
                  <Button
                    onClick={() => handleOverlay(i)}
                    name="remove"
                    variant="danger"
                  >
                    {"\u00D7"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Col>
    </Row>
  );
};

export default LeagueCreationTable;
