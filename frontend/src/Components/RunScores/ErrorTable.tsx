import React from "react";
import { Table, Button } from "react-bootstrap";
import { ScoringError } from "@ff-mern/ff-types";

type ErrorTableProps = {
  errors: ScoringError[];
  handleFix: (error: ScoringError, index: number) => void;
};

const ErrorTable = ({ errors, handleFix }: ErrorTableProps) => {
  return (
    <Table striped bordered hover className="table-width">
      <thead>
        <tr>
          <th>Player</th>
          <th>Description</th>
          <th>Fix</th>
        </tr>
      </thead>
      <tbody>
        {errors.map((error, i) => (
          <tr key={i}>
            <td>{error.player.fullName}</td>
            <td>{error.desc}</td>
            <td>
              <Button onClick={() => handleFix(error, i)}>Fix Error</Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default ErrorTable;
