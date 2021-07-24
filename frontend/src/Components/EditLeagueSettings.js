import React, { useState, useCallback, useEffect } from "react";
import { Container, Form, Button, Row, Image, Col } from "react-bootstrap";
import { Redirect, useParams } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { v4 } from "uuid";
import { storage, auth } from "../firebase-config";

import EditLineupSettingsForm from "./EditLineupSettingsForm";
import { useLeague } from "../hooks/useLeague";
import LeagueCreationTable from "./LeagueCreationTable";
import LeagueCreationHeader from "./LeagueCreationHeader";

function EditLeagueSettings() {
  const { id } = useParams();
  const { league, teams: initTeams } = useLeague(id);
  const [numTeams, setNumTeams] = useState(0);
  const [teams, setTeams] = useState([]);
  const [deletedTeams, setDeletedTeams] = useState([]);
  const [redirect, setRedirect] = useState(false);
  const [loading, setLoading] = useState(false);
  const [leagueName, setLeagueName] = useState("");
  const [posInfo, setPosInfo] = useState({});
  const [numWeeks, setNumWeeks] = useState(0);
  const [changedLogo, setChangedLogo] = useState(false);
  const [imageUrl, setImageUrl] = useState(
    `${process.env.REACT_APP_DEFAULT_LOGO}`
  );
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (league) {
        setRedirect(!league.commissioners.includes(user.uid));
        console.log("running useEffect");
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
  }, [league, initTeams]);

  const onDrop = useCallback((acceptedFiles) => {
    const reader = new FileReader();
    reader.onload = (url) => {
      setImageUrl(url.target.result);
      setChangedLogo(true);
    };
    reader.readAsDataURL(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  function handleTeamChange(e) {
    const tempTeams = [...teams];
    if (e.target.name === "isCommissioner") {
      tempTeams[e.target.dataset.id][e.target.name] =
        !tempTeams[e.target.dataset.id][e.target.name];
    } else tempTeams[e.target.dataset.id][e.target.name] = e.target.value;
    setTeams(tempTeams);
  }

  function handleSizeChange(evtKey) {
    setNumWeeks(parseInt(evtKey, 10));
  }

  function handleOverlay(ind) {
    const tempTeams = [...teams];
    const tempDelTeams = [...deletedTeams];
    const teamToDelete = tempTeams.splice(ind, 1);
    tempDelTeams.push(teamToDelete[0]);
    setDeletedTeams(tempDelTeams);
    setTeams(tempTeams);
  }

  function handleInfoChange(e) {
    const tempInfo = { ...posInfo };
    tempInfo[e.target.name] = e.target.value;
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
          const reqBody = {
            league: {
              ...league,
              lineupSettings: posInfo,
              numWeeks,
              name: leagueName,
              logo: imageId,
            },
            teams,
            deletedTeams,
          };
          await fetch(`/api/v1/league/${id}/update/`, {
            method: "POST",
            body: JSON.stringify(reqBody),
            headers: { "content-type": "application/json" },
          });
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
          logo: league.logo || process.env.REACT_APP_DEFAULT_LOGO,
        },
        teams,
        deletedTeams,
      };
      await fetch(`/api/v1/league/${id}/update/`, {
        method: "POST",
        body: JSON.stringify(reqBody),
        headers: { "content-type": "application/json" },
      });
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
          allowTeamSizeChanges={false}
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
                tempTeams.push({
                  name: `Team ${(tempTeams.length + 1).toString()}`,
                  teamOwner: "default",
                  isCommissioner: false,
                });
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
