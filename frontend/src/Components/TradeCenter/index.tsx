import { useMemo, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { useParams } from "react-router-dom";
import LeagueButton from "../shared/LeagueButton";
import { MenuSelector } from "../shared/MenuSelector";
import { CreateTrade } from "./CreateTrade";
import { ViewTrades } from "./ViewTrades";

type TradeScreen = "create trade" | "view trades";

export const TradeCenter = () => {
  const { id } = useParams() as { id: string };
  const [selectedScreen, setSelectedScreen] =
    useState<TradeScreen>("view trades");
  const screenOptions = useMemo(() => {
    return {
      "create trade": <CreateTrade />,
      "view trades": <ViewTrades />,
    };
  }, []);

  return (
    <Container>
      <Row className="mt-3">
        <Col>
          <LeagueButton id={id} />
        </Col>
      </Row>
      <Row className="mt-3">
        <Col>
          <MenuSelector
            options={["view trades", "create trade"]}
            selectedOption={selectedScreen}
            onChange={(e) =>
              setSelectedScreen(e.currentTarget.textContent as TradeScreen)
            }
          />
        </Col>
      </Row>
      <Row>
        <Col>{screenOptions[selectedScreen]}</Col>
      </Row>
    </Container>
  );
};
