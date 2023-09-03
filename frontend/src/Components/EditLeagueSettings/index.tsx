import React, { useState, useCallback, useEffect } from "react";
import { Container, Form, Button, Row, Image, Col } from "react-bootstrap";
import { Navigate, useParams } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { v4 } from "uuid";
import { storage } from "../../firebase-config";

import EditLineupSettingsForm from "../shared/EditLineupSettingsForm";
import { useLeague } from "../../hooks/query/useLeague";
import LeagueCreationTable from "../shared/LeagueCreationTable";
import LeagueCreationHeader from "../shared/LeagueCreationHeader";
import {
  Team,
  PositionInfo,
  emptyDefaultPositions,
  Position,
} from "@ff-mern/ff-types";
import { ref, getDownloadURL, uploadString } from "firebase/storage";
import { useTeams } from "../../hooks/query/useTeams";
import { useUpdateLeagueMutation } from "../../hooks/query/useUpdateLeagueMutation";
import { IncDecInput } from "../CreateLeague/IncDecInput";
import LeagueButton from "../shared/LeagueButton";

function EditLeagueSettings() {
  const { id } = useParams() as { id: string };
  const { league } = useLeague(id);
  const { teams: initTeams } = useTeams(id);
  const [numTeams, setNumTeams] = useState(0);
  const [teams, setTeams] = useState<Team[]>([]);
  const [deletedTeams, setDeletedTeams] = useState<Team[]>([]);
  const [redirect, setRedirect] = useState(false);
  const [loading, setLoading] = useState(false);
  const [leagueName, setLeagueName] = useState("");
  const [posInfo, setPosInfo] = useState<PositionInfo>(emptyDefaultPositions);
  const [numWeeks, setNumWeeks] = useState(0);
  const [numSuperflex, setNumSuperflex] = useState("0");
  const [changedLogo, setChangedLogo] = useState(false);
  const [imageUrl, setImageUrl] = useState(
    `${process.env.REACT_APP_DEFAULT_LOGO}`
  );
  const updateLeagueQuery = useUpdateLeagueMutation(id, {
    league,
    teams,
    deletedTeams,
    leagueName,
    posInfo,
    numSuperflex: parseInt(numSuperflex),
  });
  useEffect(() => {
    if (league) {
      if (!teams.length) {
        setTeams(initTeams);
        setNumTeams(initTeams.length);
      }
      if (league.logo !== process.env.REACT_APP_DEFAULT_LOGO) {
        getDownloadURL(ref(storage, `logos/${league.logo}`)).then((url) => {
          setImageUrl(url);
        }).catch((err) => {
          console.log(err);
        });
      }
      setLeagueName(league.name);
      setNumWeeks(league.numWeeks);
      setPosInfo(league.lineupSettings);
      setNumSuperflex(league.numSuperflex.toString());
    }
  }, [league, initTeams, teams.length]);

  const onDrop = useCallback(<T extends File>(acceptedFiles: T[]) => {
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

  function handleSuperflexChange(newNum: string) {
    setNumSuperflex(newNum);
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
    const leagueRef = ref(storage, `logos/${imageId}`);
    if (imageUrl !== process.env.REACT_APP_DEFAULT_LOGO && changedLogo) {
      uploadString(leagueRef, imageUrl, "data_url")
        .then(async () => {
          updateLeagueQuery.mutate({ imageId: imageId, changed: true });
          setRedirect(true);
          setLoading(false);
        })
        .catch((e) => {
          console.log(e);
        });
    } else {
      updateLeagueQuery.mutate({ imageId: "", changed: false });
      setRedirect(true);
      setLoading(false);
    }
  }

  if (redirect) {
    return <Navigate to={`/league/${id}/`} />;
  }
  return (
    <Container>
      <Row className="mt-3 mb-3">
        <Col>
          <LeagueButton id={id} />
        </Col>
      </Row>
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
        <Row>
          <Col sm={2}>
            <Form.Label className="mt-1">Superflex Lineups:</Form.Label>
          </Col>
          <Col sm={1}>
            <IncDecInput
              value={numSuperflex}
              onChange={handleSuperflexChange}
            />
          </Col>
        </Row>
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
          <Col>
            <Image className="image-fit" src={imageUrl} />
          </Col>
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
