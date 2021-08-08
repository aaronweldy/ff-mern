import React, { useEffect, useState } from 'react';
import {
  Card, CardDeck, Button, Container, Row,
} from 'react-bootstrap';
import { auth, storage } from '../firebase-config';
import 'firebase/auth';
import '../CSS/LeaguePages.css';

const TeamHub = () => {
  const [teams, setTeams] = useState([]);
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) {
        const url = `/api/v1/user/${user.uid}/leagues/`;
        fetch(process.env.REACT_APP_PUBLIC_URL + url)
          .then((resp) => {
            if (!resp.ok) throw Error(resp.statusText);
            return resp.json();
          })
          .then(async (data) => {
            setTeams(data.teams);
            for (const [index, team] of data.teams.entries()) {
              if (team.leagueLogo) {
                storage
                  .ref(`logos/${team.leagueLogo}`)
                  .getDownloadURL()
                  .then((url) => {
                    setTeams((teams) => {
                      const tempTeams = [...teams];
                      tempTeams[index].logoUrl = url;
                      console.log(tempTeams);
                      return tempTeams;
                    });
                  });
              }
            }
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
                    src={team.logoUrl ? team.logoUrl : team.logo}
                  />
                </a>
                <div className="mt-auto">
                  <Card.Title>{team.name}</Card.Title>
                  <Card.Text>{team.leagueName}</Card.Text>
                  <Button
                    className="mt-auto"
                    href={`/league/${team.league}/`}
                  >
                    Go to league
                  </Button>
                </div>
              </Card.Body>
              {team.isCommissioner ? (
                <Card.Footer>Commissioner</Card.Footer>
              ) : (
                ''
              )}
            </Card>
          ))}
        </CardDeck>
      </Row>
      <Row className="justify-content-center">
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
