import React from "react";
import { Button, Col, Row } from "react-bootstrap";
import { FaArrowLeft } from "react-icons/fa";
import "../../../CSS/LeaguePages.css";

type LeagueButtonProps = {
  id: string;
};

export default function LeagueButton({ id }: LeagueButtonProps) {
  return (
    <Row>
      <Col>
        <Button href={`/league/${id}/`} variant="outline-dark">
          <FaArrowLeft />
        </Button>
      </Col>
    </Row>
  );
}
