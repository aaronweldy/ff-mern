import React, { useState, useCallback } from "react";
import { Container, Form, Button, Row, Image } from "react-bootstrap";
import { Redirect } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { v4 } from "uuid";
import EditLineupSettingsForm from "../shared/EditLineupSettingsForm";
import { storage } from "../../firebase-config";
import LeagueCreationTable from "../shared/LeagueCreationTable";
import LeagueCreationHeader from "../shared/LeagueCreationHeader";
import ScoringSettingCheckGroup, {
  ScoringType,
} from "./ScoringSettingCheckGroup";
import {
  emptyDefaultPositions,
  Position,
  PositionInfo,
} from "../../ff-types/Position";
import { Team } from "../../ff-types/Team";

function CreateLeague() {
  const [numTeams, setNumTeams] = useState(0);
  const [teams, setTeams] = useState<Team[]>([]);
  const [partTwo, setPartTwo] = useState(false);
  const [partThree, setPartThree] = useState(false);
  const [redirect, setRedirect] = useState(false);
  const [loading, setLoading] = useState(false);
  const [leagueName, setLeagueName] = useState("");
  const [posInfo, setPosInfo] = useState<PositionInfo>(emptyDefaultPositions);
  const [leagueId, setLeagueId] = useState(0);
  const [numWeeks, setNumWeeks] = useState(0);
  const [scoring, setScoring] = useState("Standard");
  const [imageUrl, setImageUrl] = useState(
    `${process.env.REACT_APP_DEFAULT_LOGO}`
  );

  const onDrop = useCallback((acceptedFiles) => {
    const reader = new FileReader();
    reader.onload = (url) => {
      setImageUrl(url?.target?.result as string);
    };
    reader.readAsDataURL(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  function handleTeamChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLFormElement>,
    id: number,
    name: string,
    isCommissioner?: boolean
  ) {
    const tempTeams = [...teams];
    switch (name) {
      case "isCommissioner":
        console.log(name);
        tempTeams[id][name] = isCommissioner ?? false;
        break;
      case "name":
      case "ownerName":
        tempTeams[id][name] = e.target.value;
        break;
    }
    setTeams(tempTeams);
  }

  function handleSizeChange(evtKey: string, name: string) {
    switch (name) {
      case "teams": {
        setNumTeams(parseInt(evtKey));
        setTeams(
          Array(parseInt(evtKey))
            .fill(0)
            .map(
              (_, i) => new Team(`Team ${i}`, leagueName, "", false, numWeeks)
            )
        );
        break;
      }
      case "weeks":
        setNumWeeks(parseInt(evtKey));
        teams.forEach((team) => {
          team.updateNumWeeks(parseInt(evtKey));
        });
        break;
    }
  }

  const handleInfoChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    name: Position
  ) => {
    const tempInfo = { ...posInfo };
    tempInfo[name] = parseInt(e.target.value);
    setPosInfo(tempInfo);
  };

  function handleOverlay(ind: number) {
    const tempTeams = [...teams];
    tempTeams.splice(ind, 1);
    setTeams(tempTeams);
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
          const resp = await fetch(
            `${process.env.REACT_APP_PUBLIC_URL}/api/v1/league/create/`,
            {
              method: "POST",
              body: JSON.stringify(reqBody),
              headers: { "content-type": "application/json" },
            }
          );
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
      const resp = await fetch(
        `${process.env.REACT_APP_PUBLIC_URL}/api/v1/league/create/`,
        {
          method: "POST",
          body: JSON.stringify(reqBody),
          headers: { "content-type": "application/json" },
        }
      );
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
        leagueName={leagueName}
        handleSizeChange={handleSizeChange}
        setLeagueName={setLeagueName}
        numTeams={numTeams}
        numWeeks={numWeeks}
        allowTeamSizeChanges={true}
      />
      {partTwo ? (
        <LeagueCreationTable
          teams={teams}
          handleOverlay={handleOverlay}
          handleChange={handleTeamChange}
        />
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
            scoring={scoring as ScoringType}
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
