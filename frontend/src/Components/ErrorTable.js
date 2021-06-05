import { Table, Button } from "react-bootstrap";

const ErrorTable = (props) => {
  const { errors, handleFix } = props;

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
        {errors.map((error, i) => {
          return (
            <tr key={i}>
              <td>{error.player.name}</td>
              <td>{error.desc}</td>
              <td>
                <Button onClick={() => handleFix(error, i)}>Fix Error</Button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
};

export default ErrorTable;
