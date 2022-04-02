import React, { useState, useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import {
  Container,
  Col,
  Form,
  Button,
  Row,
  OverlayTrigger,
} from "react-bootstrap";
import LeagueButton from "../shared/LeagueButton";
import {
  Position,
  Qualifier,
  ScoringCategory,
  scoringTypes,
} from "@ff-mern/ff-types";
import { useLeagueSettingsMutation } from "../../hooks/query/useLeagueSettingsMutation";
import { useLeague } from "../../hooks/query/useLeague";
//import { useLeagueSettingsMutation } from "../../hooks/query/useLeagueSettingsMutation";

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

type CategoryChange =
  | "threshold"
  | "thresholdMin"
  | "thresholdMax"
  | "statType"
  | "qualifier";

type MinimumChange = "threshold" | "statType";

type ModifiableSetting = {
  position: Position;
  points: string;
  category: {
    qualifier: Qualifier;
    threshold: string;
    statType: ScoringCategory;
    thresholdMin?: string;
    thresholdMax?: string;
  };
  minimums: {
    statType: ScoringCategory;
    threshold: string;
  }[];
};

const ScoringSettings = () => {
  const [settings, setSettings] = useState<ModifiableSetting[]>([]);
  const [redirect, setRedirect] = useState(false);
  const { id } = useParams() as { id: string };
  const { mutate } = useLeagueSettingsMutation(id);
  const { league } = useLeague(id);
  useEffect(() => {
    if (league) {
      const newSettings: ModifiableSetting[] = league.scoringSettings.map(
        (setting) => ({
          position: setting.position,
          points: setting.points.toString(),
          category: {
            qualifier: setting.category.qualifier,
            threshold: setting.category.threshold.toString(),
            statType: setting.category.statType,
          },
          minimums: setting.minimums.map((minimum) => ({
            statType: minimum.statType,
            threshold: minimum.threshold.toString(),
          })),
        })
      );
      setSettings(newSettings);
    }
  }, [league]);
  const handleSettingChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLSelectElement>,
    settingIdx: number,
    name: string
  ) => {
    const tempSettings = [...settings];
    switch (name) {
      case "points":
        tempSettings[settingIdx].points = e.target.value;
        break;
      case "position":
        tempSettings[settingIdx].position = e.target.value as Position;
        break;
    }

    setSettings(tempSettings);
  };
  const handleAddSetting = () => {
    const tempSettings = [...settings];
    tempSettings.push({
      position: "QB",
      points: "0",
      category: { qualifier: "per", threshold: "0", statType: "PASS YD" },
      minimums: [],
    });
    setSettings(tempSettings);
  };
  const handleCategoryChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLSelectElement>,
    settingIdx: number,
    name: CategoryChange
  ) => {
    const tempSettings = [...settings];
    switch (name) {
      case "qualifier":
        tempSettings[settingIdx].category.qualifier = e.target
          .value as Qualifier;
        break;
      case "threshold":
        tempSettings[settingIdx].category.threshold = e.target.value;
        break;
      case "thresholdMin":
        tempSettings[settingIdx].category.thresholdMin = e.target.value;
        break;
      case "thresholdMax":
        tempSettings[settingIdx].category.thresholdMax = e.target.value;
        break;
      case "statType":
        tempSettings[settingIdx].category.statType = e.target
          .value as ScoringCategory;
        break;
    }
    setSettings(tempSettings);
  };
  const handleRemoveSetting = (index: number) => {
    const tempSettings = [...settings];
    console.log(index);
    tempSettings.splice(index, 1);
    console.log(settings);
    console.log(tempSettings);
    setSettings(tempSettings);
  };
  const handleRemoveMinimum = (settingIdx: number, minIdx: number) => {
    const tempSettings = [...settings];
    tempSettings[settingIdx].minimums.splice(minIdx, 1);
    setSettings(tempSettings);
  };
  const handleAddMinimum = (settingIdx: number) => {
    const tempSettings = [...settings];
    tempSettings[settingIdx].minimums.push({
      statType: "ATT",
      threshold: "0",
    });
    setSettings(tempSettings);
  };
  const handleMinimumChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    settingIdx: number,
    minIdx: number,
    name: MinimumChange
  ) => {
    const tempSettings = [...settings];
    switch (name) {
      case "threshold":
        tempSettings[settingIdx].minimums[minIdx].threshold = e.target.value;
        break;
      case "statType":
        tempSettings[settingIdx].minimums[minIdx].statType = e.target
          .value as ScoringCategory;
        break;
    }

    setSettings(tempSettings);
  };
  const sendData = () => {
    const updatedSettings = settings.map((setting) => ({
      position: setting.position,
      points: parseFloat(setting.points) || 0,
      category: {
        qualifier: setting.category.qualifier,
        threshold: parseFloat(setting.category.threshold) || 0,
        statType: setting.category.statType,
        thresholdMin: parseFloat(setting.category?.thresholdMin || "0"),
        thresholdMax: parseFloat(setting.category?.thresholdMax || "0"),
      },
      minimums: setting.minimums.map((minimum) => ({
        statType: minimum.statType,
        threshold: parseFloat(minimum.threshold) || 0,
      })),
    }));
    mutate(updatedSettings);
    setRedirect(true);
  };
  if (redirect) {
    return <Navigate to={`/league/${id}/`} />;
  }
  return (
    <Container fluid>
      <Row>
        <Col>
          <LeagueButton id={id} />
        </Col>
      </Row>
      <Row>
        <Col>
          <h2 className="mb-5">Scoring Settings</h2>
        </Col>
      </Row>
      {settings
        ? settings.map((setting, i) => (
            <OverlayTrigger
              key={i}
              placement="top-start"
              delay={1000}
              overlay={
                <Button
                  onClick={() => handleRemoveSetting(i)}
                  variant="danger"
                  size="sm"
                  className="ml-2 mb-2"
                >
                  Remove setting
                </Button>
              }
            >
              <Row className="mt-3 mb-5">
                <Col md={2}>
                  <Form.Control
                    as="select"
                    defaultValue={setting.position}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      handleSettingChange(e, i, "position")
                    }
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
                    value={setting.points}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleSettingChange(e, i, "points")
                    }
                    type="text"
                  />{" "}
                  {setting.points === "1" ? "point" : "points"}
                </Col>
                <Col md={2}>
                  <Row>
                    <Col>
                      <Form.Control
                        as="select"
                        value={setting.category.qualifier || "per"}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          handleCategoryChange(e, i, "qualifier")
                        }
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
                          value={setting.category.thresholdMin || ""}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleCategoryChange(e, i, "thresholdMin")
                          }
                          type="text"
                        />
                      </Col>
                      and
                      <Col>
                        <Form.Control
                          value={setting.category.thresholdMax || ""}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleCategoryChange(e, i, "thresholdMax")
                          }
                          type="text"
                        />
                      </Col>
                    </Row>
                  ) : (
                    <Row>
                      <Col>
                        <Form.Control
                          value={setting.category.threshold || ""}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleCategoryChange(e, i, "threshold")
                          }
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
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          handleCategoryChange(e, i, "statType")
                        }
                      >
                        {scoringTypes.map((type, idx) => (
                          <option key={idx} value={type}>
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
                    delay={1000}
                    overlay={
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleRemoveMinimum(i, j)}
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
                            value={min.threshold || ""}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) => handleMinimumChange(e, i, j, "threshold")}
                            type="text"
                          />
                        </Col>
                      </Row>
                      <Row>
                        <Col>
                          <Form.Control
                            as="select"
                            defaultValue={min.statType}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) => handleMinimumChange(e, i, j, "statType")}
                          >
                            {scoringTypes.map((type, idx) => (
                              <option key={idx} value={type}>
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
                    onClick={() => handleAddMinimum(i)}
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
        <Col>
          <Button variant="primary" className="mt-4" onClick={handleAddSetting}>
            Add new setting
          </Button>
        </Col>
      </Row>
      <Row className="justify-content-center mt-4 mb-5">
        <Col>
          <Button variant="success" onClick={sendData}>
            Submit
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default ScoringSettings;
