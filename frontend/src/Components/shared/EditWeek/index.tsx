import React, { useId } from "react";
import { Form } from "react-bootstrap";

type EditWeekProps = {
  week: number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  maxWeeks?: number;
};

const EditWeek = ({ week, onChange, maxWeeks = 18 }: EditWeekProps) => {
  const id = useId();
  return (
    <div className="week-selector my-3">
      <Form.Label htmlFor={id} className="mb-0">
        Week:
      </Form.Label>
      <Form.Control id={id} as="select" value={week} onChange={onChange}>
        {[...Array(maxWeeks || 18)].map((_, i) => (
          <option value={i + 1} key={i}>
            {i + 1}
          </option>
        ))}
      </Form.Control>
    </div>
  );
};

export default EditWeek;
