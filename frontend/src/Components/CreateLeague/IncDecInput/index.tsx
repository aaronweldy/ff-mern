import { Form } from "react-bootstrap";

type IncDecInputProps = {
  value: string;
  onChange: (val: string) => void;
};

export const IncDecInput = ({ value, onChange }: IncDecInputProps) => {
  return (
    <Form.Control
      value={value}
      type="number"
      onChange={(e) => onChange(e.target.value ?? "0")}
    />
  );
};
