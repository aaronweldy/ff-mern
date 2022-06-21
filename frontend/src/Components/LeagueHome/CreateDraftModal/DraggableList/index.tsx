import { SimplifiedTeamInfo } from "@ff-mern/ff-types";
import React from "react";
import { UseFormSetValue } from "react-hook-form";
import { DraftFormState } from "..";
import { DraggableCard } from "../DraggableCard";

type DraggableListProps = {
  value: SimplifiedTeamInfo[];
  setValue: UseFormSetValue<DraftFormState>;
};

export const DraggableList = React.forwardRef(
  ({ value, setValue }: DraggableListProps, ref) => {
    const moveItem = (dragIndex: number, hoverIndex: number) => {
      const newTeams = [...value];
      newTeams.splice(dragIndex, 1);
      newTeams.splice(hoverIndex, 0, value[dragIndex]);
      setValue("draftOrder", newTeams);
    };
    return (
      <div className="draggable-list">
        {value.map((team, index) => (
          <DraggableCard
            key={team.id}
            id={team.id}
            teamInfo={team}
            index={index}
            moveCard={moveItem}
          />
        ))}
      </div>
    );
  }
);
