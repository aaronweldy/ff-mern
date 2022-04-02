import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  InputGroup,
  FormControl,
  Button,
  Card,
  CardDeck,
} from "react-bootstrap";
import { Navigate } from "react-router-dom";
import { auth } from "../../firebase-config";
import { useLeagueSearchMutations } from "../../hooks/query/useLeagueSearchMutations";
import { useAuthUser } from "@react-query-firebase/auth";

const JoinLeague = () => {
  const [leagueName, setLeagueName] = useState("");
  const [redirect, setRedirect] = useState(false);
  const user = useAuthUser("user", auth);
  const { findLeagueQuery, joinLeagueQuery, urlMap } =
    useLeagueSearchMutations();
  console.log(urlMap);
  const handleSearch = async () => {
    findLeagueQuery.mutate(leagueName);
  };

  const handleJoin = (id: string) => {
    if (user.isSuccess) {
      joinLeagueQuery.mutate({ id, userEmail: user.data?.email || "" });
      setRedirect(true);
    }
  };

  if (redirect && joinLeagueQuery.isSuccess) {
    return <Navigate to={joinLeagueQuery.data.url} />;
  }

  return (
    <Container>
      <Row className="mt-4">
        <Col className="justify-content-center">
          <InputGroup>
            <FormControl
              placeholder="Search for league"
              value={leagueName || ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setLeagueName(e.target.value)
              }
            />
            <Button onClick={handleSearch}>Submit</Button>
          </InputGroup>
        </Col>
      </Row>
      <Row className="mt-5">
        <Col>
          <CardDeck>
            {findLeagueQuery.isSuccess &&
              Object.entries(findLeagueQuery.data).map(([id, league]) => {
                return (
                  <Card key={league.name + id} className="card-size">
                    <Card.Img
                      variant="bottom"
                      className="mt-auto"
                      src={urlMap[id] || process.env.REACT_APP_DEFAULT_LOGO}
                    />
                    <Card.Title className="d-flex justify-content-center">
                      <div className="font-weight-bold">{league.name}</div>
                    </Card.Title>
                    <Card.Body className="d-flex flex-column align-content-end">
                      <Button onClick={() => handleJoin(id)}>
                        Join League
                      </Button>
                    </Card.Body>
                  </Card>
                );
              })}
          </CardDeck>
        </Col>
      </Row>
    </Container>
  );
};

export default JoinLeague;
