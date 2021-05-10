import React, {useEffect, useState} from 'react'
import {useSelector, useDispatch} from 'react-redux'
import {selectStatus, selectUser } from '../Redux/userSlice.js'
import { Card, CardDeck, Navbar, Button, Container, Row, Col } from 'react-bootstrap'
import '../CSS/LeaguePages.css'

const TeamHub = () => {
  const dispatch = useDispatch();
  const loggedIn = useSelector(selectStatus);
  const currUser = useSelector(selectUser);
  let [teams, setTeams] = useState([]);
  useEffect(() => {
    async function fetchTeams() {
      const url = `/api/v1/user/${currUser.username}/leagues/`;
      await fetch(url).then(resp => {
          if(!resp.ok) throw Error(resp.statusText);
          return resp.json();
        }).then(data => {
          setTeams(data.teams);
        }).catch(e => {
          console.log(e);
      });
      
    }
    if(loggedIn) {
      fetchTeams();
    }
  }, [dispatch, currUser, loggedIn])
  return (
    <Container fluid>
      {!loggedIn ? <Row className='justify-content-center'><h1>Please <a href='/login/'>log in.</a></h1></Row> :
      <Col>
        <Row className="justify-content-center">
          <Col sm={10}>
            <CardDeck id="teamCards">
            {teams.map((team, index) => {
              return (
              <Card key={index} className="m-2">
                  <a href={'/league/' + team.league + '/team/' + team._id + '/'}>
                  <Card.Img variant="top" src={team.logo} className="card-img-top"></Card.Img>
                  </a>
                <Card.Body>
                  <Card.Title>
                    {team.name}
                  </Card.Title>
                  <Card.Text>
                    {team.leagueName}
                  </Card.Text>
                  <Button href={'/league/' + team.league + '/'}>Go to league</Button>
                </Card.Body>
                {team.isCommissioner ? <Card.Footer>Commissioner</Card.Footer> : ''}
              </Card>);
              })}
            </CardDeck>
          </Col>
        </Row>
        <Row className="justify-content-center">
          <Button className="m-3" variant="primary" size="lg" href="/league/create/">Create a league</Button>
        </Row>
      </Col>}
    </Container>
  );
}

export default TeamHub;
