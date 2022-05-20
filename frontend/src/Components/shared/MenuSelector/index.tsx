import React from "react";
import "./style.css";

type MenuSelectorProps = {
  options: string[];
  selectedOption: string;
  onChange: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
};

export const MenuSelector = ({
  onChange,
  options,
  selectedOption,
}: MenuSelectorProps) => {
  return (
    <ul className="toggle-list">
      {options.map((option) => (
        <li key={option}>
          <button
            className={`selectable-item ${
              option === selectedOption ? "selected-item" : ""
            }`}
            onClick={(e) => onChange(e)}
            key={option}
          >
            {option}
          </button>
        </li>
      ))}
    </ul>
  );
};
