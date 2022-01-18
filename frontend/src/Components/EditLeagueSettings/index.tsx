import React, { useState, useCallback, useEffect } from "react";
import { Container, Form, Button, Row, Image, Col } from "react-bootstrap";
import { Redirect, useParams } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { v4 } from "uuid";
import { storage, auth } from "../../firebase-config";

import EditLineupSettingsForm from "../shared/EditLineupSettingsForm";
import { useLeague } from "../../hooks/useLeague";
import LeagueCreationTable from "../shared/LeagueCreationTable";
import LeagueCreationHeader from "../shared/LeagueCreationHeader";
import {
  Team,
  PositionInfo,
  emptyDefaultPositions,
  Position,
  League,
} from "@ff-mern/ff-types";

function EditLeagueSettings() {
  const { id } = useParams<{ id: string }>();
  const { league, teams: initTeams } = useLeague(id);
  const [numTeams, setNumTeams] = useState(0);
  const [teams, setTeams] = useState<Team[]>([]);
  const [deletedTeams, setDeletedTeams] = useState<Team[]>([]);
  const [redirect, setRedirect] = useState(false);
  const [loading, setLoading] = useState(false);
  const [leagueName, setLeagueName] = useState("");
  const [posInfo, setPosInfo] = useState<PositionInfo>(emptyDefaultPositions);
  const [numWeeks, setNumWeeks] = useState(0);
  const [changedLogo, setChangedLogo] = useState(false);
  const [imageUrl, setImageUrl] = useState(
    `${process.env.REACT_APP_DEFAULT_LOGO}`
  );
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (league && user) {
        setRedirect(!league.commissioners.includes(user.uid));
        if (!teams.length) {
          setTeams(initTeams);
          setNumTeams(initTeams.length);
        }
        if (league.logo !== process.env.REACT_APP_DEFAULT_LOGO) {
          storage
            .ref(`logos/${league.logo}`)
            .getDownloadURL()
            .then((url) => {
              setImageUrl(url);
            });
        }
        setLeagueName(league.name);
        setNumWeeks(league.numWeeks);
        setPosInfo(league.lineupSettings);
      }
    });
    return () => unsub();
  }, [league, initTeams, teams.length]);

  const onDrop = useCallback((acceptedFiles) => {
    const reader = new FileReader();
    reader.onload = (url) => {
      if (url) {
        setImageUrl(url?.target?.result as string);
        setChangedLogo(true);
      }
    };
    reader.readAsDataURL(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  function handleTeamChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLFormElement>,
    teamId: number,
    name: string,
    isCommissioner?: boolean
  ) {
    const tempTeams = [...teams];
    switch (name) {
      case "isCommissioner":
        tempTeams[teamId][name] = isCommissioner ?? false;
        break;
      case "name":
      case "ownerName":
        tempTeams[teamId][name] = e.target.value;
        break;
    }
    setTeams(tempTeams);
  }

  function handleSizeChange(evtKey: string) {
    setNumWeeks(parseInt(evtKey, 10));
    teams.forEach((team) => Team.updateNumWeeks(team, parseInt(evtKey, 10)));
  }

  function handleOverlay(ind: number) {
    const tempTeams = [...teams];
    const tempDelTeams = [...deletedTeams];
    const teamToDelete = tempTeams.splice(ind, 1);
    tempDelTeams.push(teamToDelete[0]);
    setDeletedTeams(tempDelTeams);
    setTeams(tempTeams);
  }

  function handleInfoChange(
    e: React.ChangeEvent<HTMLInputElement>,
    name: Position
  ) {
    const tempInfo = { ...posInfo };
    tempInfo[name] = parseInt(e.target.value) ?? 0;
    console.log(tempInfo);
    setPosInfo(tempInfo);
  }

  async function handleLeagueSubmission() {
    setLoading(true);
    const imageId = v4();
    const leagueRef = storage.ref().child(`logos/${imageId}`);
    if (imageUrl !== process.env.REACT_APP_DEFAULT_LOGO && changedLogo) {
      leagueRef
        .putString(imageUrl, "data_url")
        .then(async () => {
          const reqBody: {
            league: League;
            teams: Team[];
            deletedTeams: Team[];
          } = {
            league: {
              ...(league as League),
              lineupSettings: posInfo,
              numWeeks,
              name: leagueName,
              logo: imageId,
            },
            teams: teams.map((team) => {
              return { ...team, leagueLogo: imageUrl } as Team;
            }),
            deletedTeams,
          };
          await fetch(
            `${process.env.REACT_APP_PUBLIC_URL}/api/v1/league/${id}/update/`,
            {
              method: "POST",
              body: JSON.stringify(reqBody),
              headers: { "content-type": "application/json" },
            }
          );
          setRedirect(true);
          setLoading(false);
        })
        .catch((e) => {
          console.log(e);
        });
    } else {
      const reqBody = {
        league: {
          ...league,
          lineupSettings: posInfo,
          numWeeks,
          name: leagueName,
          logo: league?.logo || process.env.REACT_APP_DEFAULT_LOGO,
          commissioners: teams
            .filter((team) => team.owner !== "default" && team.isCommissioner)
            .map((team) => team.owner),
        },
        teams,
        deletedTeams,
      };
      await fetch(
        `${process.env.REACT_APP_PUBLIC_URL}/api/v1/league/${id}/update/`,
        {
          method: "POST",
          body: JSON.stringify(reqBody),
          headers: { "content-type": "application/json" },
        }
      );
      setRedirect(true);
      setLoading(false);
    }
  }

  if (redirect) {
    return <Redirect to={`/league/${id}/`} />;
  }
  return (
    <Container>
      <Form>
        <LeagueCreationHeader
          handleSizeChange={handleSizeChange}
          setLeagueName={setLeagueName}
          numTeams={numTeams}
          numWeeks={numWeeks}
          leagueName={leagueName}
        />
        <LeagueCreationTable
          handleOverlay={handleOverlay}
          teams={teams}
          handleChange={handleTeamChange}
        />
        <Row className="mb-5">
          <Col>
            <Button
              onClick={() => {
                const tempTeams = [...teams];
                tempTeams.push(
                  new Team(
                    `Team ${(tempTeams.length + 1).toString()}`,
                    leagueName,
                    "default",
                    false,
                    numWeeks
                  )
                );
                setTeams(tempTeams);
              }}
            >
              Add Team
            </Button>
          </Col>
        </Row>
        <EditLineupSettingsForm
          handleChange={handleInfoChange}
          positionSettings={posInfo}
        />
        <hr />
        <h4>League Logo</h4>
        <Row className="mb-3">
          <Col>
            <div {...getRootProps({ className: "dropzone" })}>
              <input {...getInputProps()} />
              Select or drop image here
            </div>
          </Col>
        </Row>
        <Row>
          <Image className="image-fit" src={imageUrl} />
        </Row>
        <Form.Row className="mb-3 mt-3">
          <Button variant="success" onClick={() => handleLeagueSubmission()}>
            Submit Updates
          </Button>
        </Form.Row>
      </Form>
      {loading ? <div className="spinning-loader" /> : ""}
    </Container>
  );
}

export default EditLeagueSettings;
