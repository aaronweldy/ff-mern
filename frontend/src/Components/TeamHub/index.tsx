import React, { useEffect, useState } from "react";
import { Card, CardDeck, Button, Container, Row } from "react-bootstrap";
import { auth, storage } from "../../firebase-config";
import "firebase/auth";
import "../../CSS/LeaguePages.css";
import { Team } from "@ff-mern/ff-types";

const TeamHub = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamLogos, setTeamLogos] = useState<Record<string, string>>({});
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) {
        const url = `${process.env.REACT_APP_PUBLIC_URL}/api/v1/user/${user.uid}/leagues/`;
        fetch(url)
          .then((resp) => {
            if (!resp.ok) {
              throw Error(resp.statusText);
            }
            return resp.json();
          })
          .then(async (data) => {
            setTeams(data.teams);
            data.teams.forEach((team: Team) => {
              if (team.leagueLogo !== process.env.REACT_APP_DEFAULT_LOGO) {
                storage
                  .ref(`logos/${team.leagueLogo}`)
                  .getDownloadURL()
                  .then((newUrl) => {
                    setTeamLogos((teamLogos) => {
                      return {
                        ...teamLogos,
                        [team.id]: newUrl,
                      };
                    });
                  });
              }
            });
          })
          .catch((e) => {
            console.log(e);
          });
      }
    });
    return () => unsub();
  }, []);
  return (
    <Container fluid>
      <Row className="justify-content-center">
        <CardDeck id="teamCards">
          {teams.map((team, index) => (
            <Card key={index} className="m-2">
              <Card.Body className="d-flex flex-column align-content-end">
                <a href={`/league/${team.league}/team/${team.id}/`}>
                  <Card.Img
                    variant="bottom"
                    className="mt-auto"
                    src={teamLogos[team.id] || team.logo}
                  />
                </a>
                <div className="mt-auto">
                  <Card.Title>{team.name}</Card.Title>
                  <Card.Text>{team.leagueName}</Card.Text>
                  <Button className="mt-auto" href={`/league/${team.league}/`}>
                    Go to league
                  </Button>
                </div>
              </Card.Body>
              {team.isCommissioner ? (
                <Card.Footer>Commissioner</Card.Footer>
              ) : (
                ""
              )}
            </Card>
          ))}
        </CardDeck>
      </Row>
      <Row className="justify-content-center">
        <Button className="m-3" href="/league/join/" size="lg">
          Join a league
        </Button>
        <Button
          className="m-3"
          variant="primary"
          size="lg"
          href="/league/create/"
        >
          Create a league
        </Button>
      </Row>
    </Container>
  );
};

export default TeamHub;
