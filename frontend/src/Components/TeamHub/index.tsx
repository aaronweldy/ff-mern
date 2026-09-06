import { Team } from "@ff-mern/ff-types";
import { useAuthUser } from "@react-query-firebase/auth";
import "firebase/auth";
import { getDownloadURL, ref } from "firebase/storage";
import { useEffect, useState } from "react";
import { Button, Container, Dropdown } from "react-bootstrap";
import { Navigate } from "react-router-dom";
import "../../CSS/LeaguePages.css";
import { auth, storage } from "../../firebase-config";
import { useTeamsByUser } from "../../hooks/query/useTeamsByUser";
import { StableImage } from "../shared/StableImage";

const TeamHub = () => {
  const user = useAuthUser("user", auth);
  const userTeamsQuery = useTeamsByUser(user?.data?.uid);
  const [teamLogos, setTeamLogos] = useState<Record<string, string>>({});
  const teamRowsLoading = !user.isSuccess || userTeamsQuery.isLoading;
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
    <Container fluid className="team-hub-page">
      <div className="team-hub-content">
        <div className="team-hub-list">
          {teamRowsLoading && (
            <div className="team-hub-loading-row" aria-hidden="true">
              <div className="team-hub-loading-logo" />
              <div className="team-hub-loading-copy">
                <div className="team-hub-loading-line team-hub-loading-line--name" />
                <div className="team-hub-loading-line" />
              </div>
            </div>
          )}
          {userTeamsQuery.isSuccess && userTeamsQuery.data.teams.length === 0 && (
            <div className="team-hub-empty-row">You don&apos;t have any teams yet.</div>
          )}
          {userTeamsQuery.isSuccess &&
            userTeamsQuery.data.teams.map((team) => (
              <div className="team-hub-team-row" key={team.id}>
                <a
                  className="team-hub-team-link"
                  href={`/league/${team.league}/team/${team.id}/`}
                >
                  <StableImage
                    size="row"
                    src={teamLogos[team.id] || team.logo}
                    alt={`${team.name} logo`}
                    frameClassName="mr-3"
                  />
                  <div className="team-hub-team-copy">
                    <div className="team-hub-team-name">{team.name}</div>
                    <div className="team-hub-team-league">{team.leagueName}</div>
                  </div>
                </a>
                <div className="team-hub-team-actions">
                  {team.isCommissioner && (
                    <span className="team-hub-commissioner">Commissioner</span>
                  )}
                  <Button href={`/league/${team.league}/`}>Go to league</Button>
                </div>
              </div>
            ))}
        </div>
        <div className="team-hub-actions">
          <Dropdown>
            <Dropdown.Toggle variant="primary" id="league-actions-dropdown">
              League actions
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item href="/league/join/">Join a league</Dropdown.Item>
              <Dropdown.Item href="/league/create/">Create a league</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>
    </Container>
  );
};

export default TeamHub;
