import { SimplifiedTeamInfo } from "@ff-mern/ff-types";
import { useRef } from "react";
import { Row, Col } from "react-bootstrap";
import { useDrop, useDrag, XYCoord } from "react-dnd";
import "./style.css";

type DraggableCardProps = {
  id: string;
  teamInfo: SimplifiedTeamInfo;
  index: number;
  moveCard: (dragIndex: number, hoverIndex: number) => void;
};

type DraggableCardItem = {
  id: string;
  teamInfo: SimplifiedTeamInfo;
  index: number;
};

export const ItemTypes = {
  CARD: "card",
};

export const DraggableCard = ({
  id,
  teamInfo,
  index,
  moveCard,
}: DraggableCardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [, drop] = useDrop<DraggableCardItem, void>({
    accept: ItemTypes.CARD,
    hover(item: DraggableCardItem, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();

      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      const clientOffset = monitor.getClientOffset();
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      moveCard(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.CARD,
    item: () => {
      return { id, index };
    },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));
  return (
    <Row
      ref={ref}
      className={`${isDragging ? "dragging" : ""} draggable-card mx-0`}
    >
      <Col xl={2}>
        <div>{index + 1}</div>
      </Col>
      <Col xl={4}>
        <div>{teamInfo.name}</div>
      </Col>
      <Col xl={6}>
        <div className="wrappable-name">{teamInfo.ownerName}</div>
      </Col>
    </Row>
  );
};
