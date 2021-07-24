import React, { useState, useEffect } from "react";
import { Redirect, useParams } from "react-router-dom";
import {
  Container,
  Col,
  Form,
  Button,
  Row,
  OverlayTrigger,
} from "react-bootstrap";
import LeagueButton from "./LeagueButton";
import { auth } from "../firebase-config";

const positionTypes = [
  "QB",
  "RB",
  "WR",
  "TE",
  "K",
  "WR/RB",
  "WR/RB/TE",
  "QB/WR/RB/TE",
];
const scoringTypes = [
  "ATT",
  "PASS YD",
  "REC YD",
  "RUSH YD",
  "CARRIES",
  "YD PER CARRY",
  "YD PER CATCH",
  "REC",
  "TARGETS",
  "PASS TD",
  "RUSH TD",
  "REC TD",
  "YD PER ATT",
  "YD PER COMPLETION",
  "CP%",
  "INT",
  "FUM",
  "FG 1-19",
  "FG 20-29",
  "FG 30-39",
  "FG 40-49",
  "FG 50+",
  "FG/XP MISS",
];

function ScoringSettings() {
  const [settings, setSettings] = useState([]);
  const [redirect, setRedirect] = useState(false);
  const { id } = useParams();
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const url = `/api/v1/league/${id}/`;
        const data = await fetch(url);
        const json = await data.json();
        setSettings(json.league.scoringSettings);
        if (!json.league.commissioners.includes(user.uid)) setRedirect(true);
      }
    });
    return () => unsub();
  }, [id]);
  const handleSettingChange = (e) => {
    const tempSettings = [...settings];
    tempSettings[e.target.dataset.setting][e.target.name] = e.target.value;
    setSettings(tempSettings);
  };
  const handleAddSetting = () => {
    const tempSettings = [...settings];
    tempSettings.push({
      position: "QB",
      points: 0,
      category: { qualifier: "per", threshold: 0, statType: "PASS YD" },
      minimums: [],
    });
    setSettings(tempSettings);
  };
  const handleCategoryChange = (e) => {
    const tempSettings = [...settings];
    tempSettings[e.target.dataset.setting].category[e.target.name] =
      e.target.value;
    setSettings(tempSettings);
  };
  const handleRemoveSetting = (e) => {
    const tempSettings = [...settings];
    tempSettings.splice(e.target.dataset.setting, 1);
    setSettings(tempSettings);
  };
  const handleRemoveMinimum = (e) => {
    const tempSettings = [...settings];
    tempSettings[e.target.dataset.setting].minimums.splice(
      e.target.dataset.min,
      1
    );
    setSettings(tempSettings);
  };
  const handleAddMinimum = (e) => {
    const tempSettings = [...settings];
    tempSettings[e.target.dataset.setting].minimums.push({
      statType: "ATT",
      threshold: 0,
    });
    setSettings(tempSettings);
  };
  const handleMinimumChange = (e) => {
    const tempSettings = [...settings];
    tempSettings[e.target.dataset.setting].minimums[e.target.dataset.min][
      e.target.name
    ] = e.target.value;
    setSettings(tempSettings);
  };
  const sendData = () => {
    const body = { id, settings };
    const url = `/api/v1/league/${id}/updateScoringSettings/`;
    const reqDict = {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    };
    fetch(url, reqDict)
      .then((data) => data.json())
      .then((json) => {
        console.log(json);
        setRedirect(true);
      });
  };
  if (redirect) return <Redirect to={`/league/${id}/`} />;
  return (
    <Container fluid>
      <Row>
        <LeagueButton id={id} />
      </Row>
      <Row>
        <h2 className="ml-3 mb-5">Scoring Settings</h2>
      </Row>
      {settings
        ? settings.map((setting, i) => (
            <OverlayTrigger
              key={i}
              placement="top-start"
              delay="1000"
              overlay={
                <Button
                  data-setting={i}
                  onClick={handleRemoveSetting}
                  variant="danger"
                  size="sm"
                  className="ml-2 mb-2"
                >
                  Remove setting
                </Button>
              }
            >
              <Row key={i} className="mt-3 mb-5">
                <Col md={2}>
                  <Form.Control
                    name="position"
                    data-setting={i}
                    as="select"
                    defaultValue={setting.position}
                    onChange={handleSettingChange}
                  >
                    {positionTypes.map((type, j) => (
                      <option value={type} key={j}>
                        {type}
                      </option>
                    ))}
                  </Form.Control>
                </Col>
                <Col md={1}>
                  <Form.Control
                    name="points"
                    data-setting={i}
                    value={setting.points}
                    onChange={handleSettingChange}
                    type="text"
                  />{" "}
                  {setting.points === "1" ? "point" : "points"}
                </Col>
                <Col md={2}>
                  <Row>
                    <Col>
                      <Form.Control
                        name="qualifier"
                        data-setting={i}
                        as="select"
                        value={setting.category.qualifier || "per"}
                        onChange={handleCategoryChange}
                      >
                        <option value="per">per</option>
                        <option value="greater than">greater than</option>
                        <option value="between">between</option>
                      </Form.Control>
                    </Col>
                  </Row>
                  {settings[i].category.qualifier === "between" ? (
                    <Row>
                      <Col>
                        <Form.Control
                          name="threshold_1"
                          data-setting={i}
                          value={setting.category.threshold_1 || ""}
                          onChange={handleCategoryChange}
                          type="text"
                        />
                      </Col>
                      and
                      <Col>
                        <Form.Control
                          name="threshold_2"
                          data-setting={i}
                          value={setting.category.threshold_2 || ""}
                          onChange={handleCategoryChange}
                          type="text"
                        />
                      </Col>
                    </Row>
                  ) : (
                    <Row>
                      <Col>
                        <Form.Control
                          name="threshold"
                          data-setting={i}
                          value={setting.category.threshold || ""}
                          onChange={handleCategoryChange}
                          type="text"
                        />
                      </Col>
                    </Row>
                  )}
                  <Row>
                    <Col>
                      <Form.Control
                        name="statType"
                        data-setting={i}
                        as="select"
                        defaultValue={setting.category.statType}
                        onChange={handleCategoryChange}
                      >
                        {scoringTypes.map((type, i) => (
                          <option key={i} value={type}>
                            {type}
                          </option>
                        ))}
                      </Form.Control>
                    </Col>
                  </Row>
                </Col>
                {setting.minimums.map((min, j) => (
                  <OverlayTrigger
                    key={i}
                    placement="bottom"
                    delay="1000"
                    overlay={
                      <Button
                        data-setting={i}
                        size="sm"
                        data-min={j}
                        variant="danger"
                        onClick={handleRemoveMinimum}
                      >
                        Remove Minimum
                      </Button>
                    }
                  >
                    <Col key={j} md={2}>
                      <Row>
                        <Col>
                          <span>Minimum:</span>
                        </Col>
                      </Row>
                      <Row>
                        <Col>
                          <Form.Control
                            name="threshold"
                            data-setting={i}
                            data-min={j}
                            value={min.threshold || ""}
                            onChange={handleMinimumChange}
                            type="text"
                          />
                        </Col>
                      </Row>
                      <Row>
                        <Col>
                          <Form.Control
                            name="statType"
                            data-setting={i}
                            data-min={j}
                            as="select"
                            defaultValue={min.statType}
                            onChange={handleMinimumChange}
                          >
                            {scoringTypes.map((type, i) => (
                              <option key={i} value={type}>
                                {type}
                              </option>
                            ))}
                          </Form.Control>
                        </Col>
                      </Row>
                    </Col>
                  </OverlayTrigger>
                ))}
                <Col sm={2}>
                  <Button
                    data-setting={i}
                    onClick={handleAddMinimum}
                    className="mt-4"
                    variant="primary"
                  >
                    Add new minimum
                  </Button>
                </Col>
              </Row>
            </OverlayTrigger>
          ))
        : ""}
      <Row className="justify-content-center">
        <Col className="ml-4">
          <Button variant="primary" className="mt-4" onClick={handleAddSetting}>
            Add new setting
          </Button>
        </Col>
      </Row>
      <Row className="justify-content-center mt-4 mb-5">
        <Col className="ml-4">
          <Button variant="success" onClick={sendData}>
            Submit
          </Button>
        </Col>
      </Row>
    </Container>
  );
}

export default ScoringSettings;
