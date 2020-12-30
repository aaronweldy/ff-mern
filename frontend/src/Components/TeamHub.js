import React, {useEffect, useState} from 'react'
import {useSelector} from 'react-redux'
import {selectStatus, selectUser } from '../Redux/userSlice.js'
import { Card, CardDeck, Navbar, Button, Container, Row } from 'react-bootstrap'

const TeamHub = () => {
  const loggedIn = useSelector(selectStatus);
  const currUser = useSelector(selectUser);
  let [teams, setTeams] = useState([]);
  useEffect(() => {
    async function fetchTeams() {
      const url = `/api/v1/user/${currUser.username}/leagues/`;
      const reqDict = {
        token: localStorage.getItem('userToken'),
      }
      const resp = await fetch(url, {credentials: "include", headers: reqDict});
      const data = await resp.json();
      setTeams(data.teams);
    }
    if(loggedIn) {
      fetchTeams();
    }
  }, [loggedIn, currUser])
  const teamCards = !loggedIn ? (<h1>Please <a href='/login/'>log in.</a></h1>) :
  (teams.map((team, index) => {
    return <Card key={index}>
      <Card.Img variant="top" src={team.logo} className="card-img-top"></Card.Img>
      <Card.Title>
        <Navbar.Brand href={'/team/' + team.name + '/'}>{team.name}</Navbar.Brand>
      </Card.Title>
      <Card.Text>
        {team.leagueName}
      </Card.Text>
      {team.isCommissioner ? <Card.Footer>Commissioner</Card.Footer> : ''}
    </Card>
  }));
  return (
    <Container fluid>
      <Row className="justify-content-center">
        <CardDeck>
          {teamCards}
        </CardDeck>
      </Row>
      <Row className="justify-content-center">
        <Button className="m-3" variant="primary" size="lg" href="/league/create/">Create a league</Button>
      </Row>
    </Container>
  );
}

export default TeamHub;
