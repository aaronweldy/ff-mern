import React, {useState, useEffect} from "react";
import { Container, Row, Col, InputGroup, FormControl, Button, Card, CardDeck } from "react-bootstrap";
import {Redirect} from 'react-router-dom';
import {storage, auth} from '../firebase-config';

const JoinLeague = () => {
  const [leagueName, setLeagueName] = useState(null);
  const [redirect, setRedirect] = useState(false);
  const [newLeagueUrl, setNewLeagueUrl] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      setUserEmail(user.email);
    });
    return () => unsub();
  }, []);

  const handleSearch = async () => {
    const url = `${process.env.REACT_APP_PUBLIC_URL}/api/v1/league/find/${leagueName}/`;
    const resp = await fetch(url);
    const data = await resp.json();
    Promise.all(Object.entries(data).map(async ([id, league]) => {
      if (league.logo !== process.env.REACT_APP_DEFAULT_LOGO) {
        const url = await storage
        .ref(`logos/${league.logo}`)
        .getDownloadURL()
        league.logoUrl = url;
      }
      league.id = id;
      return league;
    })).then(results => setSearchResults(results));
  }

  const handleJoin = (id) => {
    const url = `${process.env.REACT_APP_PUBLIC_URL}/api/v1/league/${id}/join/`;
    const body = {
      owner: userEmail,
    };
    const reqdict = {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    };
    fetch(url, reqdict).then(resp => resp.json()).then(data => {
      setNewLeagueUrl(data.url);
      setRedirect(true);
    }).catch(e => console.log(e));
  }

  if (redirect) return <Redirect to={newLeagueUrl}/>;

  return (
    <Container>
      <Row className="mt-4">
        <Col className="justify-content-center">
          <InputGroup>
            <FormControl placeholder="Search for league" value={leagueName || ''} onChange={e => setLeagueName(e.target.value)}/>
            <Button onClick={handleSearch}>Submit</Button>
          </InputGroup>
        </Col>
      </Row>
      <Row className="mt-5">
        <Col>
          <CardDeck>
          {searchResults.map(league => {
            return (
              <Card key={league.name}>
                <Card.Img variant="top" src={league.logoUrl || process.env.REACT_APP_DEFAULT_LOGO}/>
                <Card.Title>{league.name}</Card.Title>
                <Card.Body>
                  <Button onClick={() => handleJoin(league.id)}>Join League</Button>
                </Card.Body>
              </Card>
            );
          })}
          </CardDeck>
        </Col>
      </Row>
    </Container>
  )
}

export default JoinLeague;