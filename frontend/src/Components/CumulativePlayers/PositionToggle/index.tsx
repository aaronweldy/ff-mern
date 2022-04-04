import { positionTypes, SinglePosition } from "@ff-mern/ff-types";
import React from "react";
import { Col, Row, ToggleButton, ToggleButtonGroup } from "react-bootstrap";

export type PositionFilter = SinglePosition | "all";

type PositionToggleProps = {
  selectedFilter: PositionFilter;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export const PositionToggle = ({
  onChange,
  selectedFilter,
}: PositionToggleProps) => {
  return (
    <Row className="mt-3">
      <Col>
        <ToggleButtonGroup
          type="radio"
          defaultValue={"all"}
          name="positionFilter"
        >
          {["all"].concat(positionTypes).map((filterValue) => (
            <ToggleButton
              value={filterValue}
              checked={filterValue === selectedFilter}
              onChange={(e) => onChange(e)}
              key={filterValue}
            >
              {filterValue}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Col>
    </Row>
  );
};
