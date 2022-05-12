import React, { useState, useEffect, useMemo } from "react";
import { Navigate, useParams } from "react-router-dom";
import { Container, Col, Button, Row } from "react-bootstrap";
import LeagueButton from "../shared/LeagueButton";
import { Position, Qualifier, ScoringCategory } from "@ff-mern/ff-types";
import { useLeagueSettingsMutation } from "../../hooks/query/useLeagueSettingsMutation";
import { useLeague } from "../../hooks/query/useLeague";
import { SingleSettingRow } from "./SingleSettingRow";
import { PositionFilter, PositionToggle } from "../shared/PositionToggle";

export type CategoryChange =
  | "threshold"
  | "thresholdMin"
  | "thresholdMax"
  | "statType"
  | "qualifier";

export type MinimumChange = "threshold" | "statType";

export type ModifiableSetting = {
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

const filterOverlapsPosition = (filter: PositionFilter, position: Position) => {
  if (filter === "all") {
    return true;
  }
  return filter.includes(position) || position.includes(filter);
};

const getSettingsIndex = (
  settings: ModifiableSetting[],
  filter: PositionFilter,
  relativeIndex: number
) => {
  let seenSettings = 0;
  if (filter === "all") {
    return relativeIndex;
  }
  return settings.findIndex((setting) => {
    if (
      seenSettings === relativeIndex &&
      filterOverlapsPosition(filter, setting.position)
    ) {
      return true;
    } else if (filterOverlapsPosition(filter, setting.position)) {
      seenSettings++;
    }
    return false;
  });
};

const ScoringSettings = () => {
  const [settings, setSettings] = useState<ModifiableSetting[]>([]);
  const [redirect, setRedirect] = useState(false);
  const [selectedFilter, setFilter] = useState<PositionFilter>("all");
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
  const settingsToRender = useMemo(() => {
    if (selectedFilter !== "all") {
      return settings.filter((setting) => {
        return filterOverlapsPosition(selectedFilter, setting.position);
      });
    }
    return settings;
  }, [selectedFilter, settings]);
  const onPositionFilterChange = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    setFilter(e.currentTarget.textContent as PositionFilter);
  };
  const handleSettingChange = <
    K extends "points" | "position",
    V extends ModifiableSetting[K]
  >(
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLSelectElement>,
    settingIdx: number,
    name: K
  ) => {
    const tempSettings = [...settings];
    const idx = getSettingsIndex(settings, selectedFilter, settingIdx);
    tempSettings[idx][name] = e.target.value as V;
    setSettings(tempSettings);
  };
  const handleAddSetting = () => {
    const tempSettings = [...settings];
    tempSettings.push({
      position: selectedFilter === "all" ? "QB" : selectedFilter,
      points: "0",
      category: { qualifier: "per", threshold: "0", statType: "PASS YD" },
      minimums: [],
    });
    setSettings(tempSettings);
  };
  const handleCategoryChange = <
    K extends keyof ModifiableSetting["category"],
    V extends ModifiableSetting["category"][K]
  >(
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLSelectElement>,
    settingIdx: number,
    name: K
  ) => {
    const tempSettings = [...settings];
    const idx = getSettingsIndex(settings, selectedFilter, settingIdx);
    tempSettings[idx].category[name] = e.target.value as V;
    setSettings(tempSettings);
  };
  const handleRemoveSetting = (index: number) => {
    const tempSettings = [...settings];
    const idx = getSettingsIndex(settings, selectedFilter, index);
    tempSettings.splice(idx, 1);
    setSettings(tempSettings);
  };
  const handleRemoveMinimum = (settingIdx: number, minIdx: number) => {
    const tempSettings = [...settings];
    const idx = getSettingsIndex(settings, selectedFilter, settingIdx);
    tempSettings[idx].minimums.splice(minIdx, 1);
    setSettings(tempSettings);
  };
  const handleAddMinimum = (settingIdx: number) => {
    const tempSettings = [...settings];
    const idx = getSettingsIndex(settings, selectedFilter, settingIdx);
    tempSettings[idx].minimums.push({
      statType: "ATT",
      threshold: "0",
    });
    setSettings(tempSettings);
  };
  const handleMinimumChange = <
    K extends keyof ModifiableSetting["minimums"][0],
    V extends ModifiableSetting["minimums"][0][K]
  >(
    e: React.ChangeEvent<HTMLInputElement>,
    settingIdx: number,
    minIdx: number,
    name: K
  ) => {
    const tempSettings = [...settings];
    const idx = getSettingsIndex(settings, selectedFilter, settingIdx);
    tempSettings[idx].minimums[minIdx][name] = e.target.value as V;
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
      <Row className="mt-3 mb-3">
        <Col>
          <LeagueButton id={id} />
        </Col>
      </Row>
      <Row>
        <Col>
          <h2 className="m-0">Scoring Settings</h2>
        </Col>
      </Row>
      <Row>
        <Col>
          <PositionToggle
            selectedFilter={selectedFilter}
            onChange={onPositionFilterChange}
          />
        </Col>
      </Row>
      <hr />
      {settings
        ? settingsToRender.map((setting, i) => (
            <SingleSettingRow
              key={i}
              setting={setting}
              index={i}
              handleAddMinimum={handleAddMinimum}
              handleCategoryChange={handleCategoryChange}
              handleMinimumChange={handleMinimumChange}
              handleRemoveMinimum={handleRemoveMinimum}
              handleRemoveSetting={handleRemoveSetting}
              handleSettingChange={handleSettingChange}
            />
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
