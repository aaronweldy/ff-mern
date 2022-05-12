import { positionTypes, SinglePosition } from "@ff-mern/ff-types";
import React from "react";
import "./style.css";

export type PositionFilter = SinglePosition | "all";

type PositionToggleProps = {
  selectedFilter: PositionFilter;
  onChange: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
};

export const PositionToggle = ({
  onChange,
  selectedFilter,
}: PositionToggleProps) => {
  return (
    <ul className="toggle-list">
      {["all"].concat(positionTypes).map((filterValue) => (
        <li>
          <button
            className={`selectable-item ${
              filterValue === selectedFilter ? "selected-item" : ""
            }`}
            onClick={(e) => onChange(e)}
            key={filterValue}
          >
            {filterValue}
          </button>
        </li>
      ))}
    </ul>
  );
};
