import React from "react";
import "./style.css";

type PlayerSearchBarProps = {
  onTextChange: (newText: string) => void;
};

export const PlayerSearchBar = ({ onTextChange }: PlayerSearchBarProps) => (
  <input
    className="searchbar"
    placeholder="Search..."
    type="text"
    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
      onTextChange(e.target.value)
    }
  />
);
