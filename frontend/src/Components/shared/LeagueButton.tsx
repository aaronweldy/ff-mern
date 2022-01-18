import React from "react";
import { Button, Col, Row } from "react-bootstrap";
import "../../CSS/LeaguePages.css";

type LeagueButtonProps = {
  id: string;
};

export default function LeagueButton({ id }: LeagueButtonProps) {
  return (
    <Row>
      <Col>
        <Button
          className="left-corner"
          href={`/league/${id}/`}
          variant="primary"
        >
          Back to league home
        </Button>
      </Col>
    </Row>
  );
}
