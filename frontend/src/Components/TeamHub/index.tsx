import { Team } from "@ff-mern/ff-types";
import { useAuthUser } from "@react-query-firebase/auth";
import "firebase/auth";
import { getDownloadURL, ref } from "firebase/storage";
import { useEffect, useState } from "react";
import { Button, Card, CardDeck, Container, Row } from "react-bootstrap";
import { Navigate } from "react-router-dom";
import "../../CSS/LeaguePages.css";
import { auth, storage } from "../../firebase-config";
import { useTeamsByUser } from "../../hooks/query/useTeamsByUser";

const TeamHub = () => {
  const user = useAuthUser("user", auth);
  const userTeamsQuery = useTeamsByUser(user?.data?.uid);
  const [teamLogos, setTeamLogos] = useState<Record<string, string>>({});
  useEffect(() => {
    if (userTeamsQuery.isSuccess) {
      userTeamsQuery.data.teams.forEach((team: Team) => {
        if (team.leagueLogo !== import.meta.env.VITE_DEFAULT_LOGO) {
          getDownloadURL(ref(storage, `logos/${team.leagueLogo}`)).then(
            (newUrl) => {
              setTeamLogos((teamLogos) => {
                return {
                  ...teamLogos,
                  [team.id]: newUrl,
                };
              });
            }
          ).catch(
            (err) => {
              console.log(err);
            }
          );
        }
      });
    }
  }, [userTeamsQuery.isSuccess, userTeamsQuery.data]);
  if (user.isSuccess && !user.data) {
    return <Navigate to="/login" />;
  }
  return (
    <Container fluid>
      <Row className="justify-content-center">
        <CardDeck className="padded-container">
          {userTeamsQuery.isSuccess &&
            userTeamsQuery.data.teams.map((team, index) => (
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
