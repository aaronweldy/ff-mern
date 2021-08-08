import React, { useState, useCallback } from "react";
import { Container, Form, Button, Row, Image } from "react-bootstrap";
import { Redirect } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { v4 } from "uuid";
import EditLineupSettingsForm from "./EditLineupSettingsForm";
import { storage } from "../firebase-config";
import LeagueCreationTable from "./LeagueCreationTable";
import LeagueCreationHeader from "./LeagueCreationHeader";
import ScoringSettingCheckGroup from "./ScoringSettingCheckGroup";

function CreateLeague() {
  const [numTeams, setNumTeams] = useState(0);
  const [teams, setTeams] = useState([]);
  const [partTwo, setPartTwo] = useState(false);
  const [partThree, setPartThree] = useState(false);
  const [redirect, setRedirect] = useState(false);
  const [loading, setLoading] = useState(false);
  const [leagueName, setLeagueName] = useState("");
  const [posInfo, setPosInfo] = useState({});
  const [leagueId, setLeagueId] = useState(0);
  const [numWeeks, setNumWeeks] = useState(0);
  const [scoring, setScoring] = useState("Standard");
  const [imageUrl, setImageUrl] = useState(
    `${process.env.REACT_APP_DEFAULT_LOGO}`
  );

  const onDrop = useCallback((acceptedFiles) => {
    const reader = new FileReader();
    reader.onload = (url) => {
      setImageUrl(url.target.result);
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

  function handleSizeChange(evtKey, name) {
    switch (name) {
      case "teams": {
        setNumTeams(parseInt(evtKey));
        setTeams(
          Array(parseInt(evtKey))
            .fill()
            .map((_, i) => ({
              name: `Team ${i}`,
              teamOwner: "",
              isCommissioner: false,
            }))
        );
        break;
      }
      case "weeks":
        setNumWeeks(parseInt(evtKey));
        break;
      default:
        setNumWeeks(parseInt(evtKey));
    }
  }

  function handleInfoChange(e) {
    const tempInfo = { ...posInfo };
    tempInfo[e.target.name] = e.target.value;
    setPosInfo(tempInfo);
  }

  async function handleLeagueSubmission() {
    setLoading(true);
    const id = v4();
    const leagueRef = storage.ref().child(`logos/${id}`);
    if (imageUrl !== process.env.REACT_APP_DEFAULT_LOGO) {
      leagueRef
        .putString(imageUrl, "data_url")
        .then(async () => {
          const reqBody = {
            league: leagueName,
            teams,
            logo: id,
            posInfo,
            scoring,
            numWeeks,
          };
          const resp = await fetch(`${process.env.REACT_APP_PUBLIC_URL}/api/v1/league/create/`, {
            method: "POST",
            body: JSON.stringify(reqBody),
            headers: { "content-type": "application/json" },
          });
          const json = await resp.json();
          setLeagueId(json.id);
          setRedirect(true);
          setLoading(false);
        })
        .catch((e) => {
          console.log(e);
        });
    } else {
      const reqBody = {
        league: leagueName,
        teams,
        logo: process.env.REACT_APP_DEFAULT_LOGO,
        posInfo,
        scoring,
        numWeeks,
      };
      const resp = await fetch(`${process.env.REACT_APP_PUBLIC_URL}/api/v1/league/create/`, {
        method: "POST",
        body: JSON.stringify(reqBody),
        headers: { "content-type": "application/json" },
      });
      const json = await resp.json();
      setLeagueId(json.id);
      setRedirect(true);
      setLoading(false);
    }
  }

  if (redirect) {
    return <Redirect to={`/league/${leagueId}/`} />;
  }

  const subButton = partThree ? (
    <Button variant="primary" onClick={handleLeagueSubmission}>
      &gt;&gt;
    </Button>
  ) : (
    <Button
      variant="primary"
      onClick={() => (partTwo ? setPartThree(true) : setPartTwo(true))}
    >
      &gt;&gt;
    </Button>
  );
  return (
    <Container>
      <LeagueCreationHeader
        handleSizeChange={handleSizeChange}
        setLeagueName={setLeagueName}
        numTeams={numTeams}
        numWeeks={numWeeks}
        handleTeamSizeChanges={true}
      />
      {partTwo ? (
        <LeagueCreationTable teams={teams} handleChange={handleTeamChange} />
      ) : (
        ""
      )}
      {partThree ? (
        <Form>
          <EditLineupSettingsForm
            handleChange={handleInfoChange}
            positionSettings={posInfo}
          />
          <hr />
          <h4>Scoring Settings</h4>
          <ScoringSettingCheckGroup
            handleClick={setScoring}
            scoring={scoring}
          />
          <h4>League Logo</h4>
          <Row className="mb-3">
            <div {...getRootProps({ className: "dropzone" })}>
              <input {...getInputProps()} />
              Select or drop image here
            </div>
          </Row>
          <Row>
            <Image className="image-fit" src={imageUrl} />
          </Row>
        </Form>
      ) : (
        ""
      )}
      <Form.Row className="mb-3 mt-3">{subButton}</Form.Row>
      {loading ? <div className="spinning-loader" /> : ""}
    </Container>
  );
}

export default CreateLeague;
