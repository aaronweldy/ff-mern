import React, {useState, useEffect} from 'react'
import {Redirect, useParams} from 'react-router-dom'
import {Container, Col, Form, Button, Row} from 'react-bootstrap'
import LeagueButton from './LeagueButton'

const positionTypes = ["QB", "RB", "WR", "TE", "K", "WR/RB", "WR/RB/TE", "QB/WR/RB/TE"];
const scoringTypes = ["ATT", "PASS YD", "REC YD", "RUSH YD", "CARRIES", "YD PER CARRY", "YD PER CATCH", "REC", "TARGETS", "PASS TD", "RUSH TD", "REC TD", "YD PER ATT", "YD PER COMPLETION", "CP%", "INT", "FUM", 'FG 1-19', 'FG 20-29', 'FG 30-39', 'FG 40-49', 'FG 50+', 'FG/XP MISS']

function ScoringSettings() {
    const [settings, setSettings] = useState([]);
    const [redirect, setRedirect] = useState(false);
    const {id} = useParams();
    useEffect(() => {
        async function fetchLeague() {
            const url = `/api/v1/league/${id}/`;
            const data = await fetch(url);
            const json = await data.json();
            setSettings(json.scoringSettings);
        }
        fetchLeague();
    }, [id]);
    const handleSettingChange = e => {
        const tempSettings = [...settings];
        tempSettings[e.target.dataset.setting][e.target.name] = e.target.value;
        setSettings(tempSettings);
    }
    const handleAddSetting = _ => {
        const tempSettings = [...settings];
        tempSettings.push({position: "QB", points: 0, category: {qualifier: "per", threshold: 0, statType: "PASS YD"}, minimums: []});
        setSettings(tempSettings);
    }
    const handleCategoryChange = e => {
        const tempSettings = [...settings];
        tempSettings[e.target.dataset.setting]['category'][e.target.name] = e.target.value;
        setSettings(tempSettings);
    }
    const handleRemoveSetting = e => {
        const tempSettings = [...settings];
        tempSettings.splice(e.target.dataset.setting, 1);
        setSettings(tempSettings);
    }
    const handleRemoveMinimum= e => {
        const tempSettings = [...settings];
        tempSettings[e.target.dataset.setting]['minimums'].splice(e.target.dataset.min, 1);
        setSettings(tempSettings);
    }
    const handleAddMinimum = e => {
        const tempSettings = [...settings];
        tempSettings[e.target.dataset.setting]['minimums'].push({statType: "ATT", threshold: 0});
        setSettings(tempSettings);
    }
    const handleMinimumChange = e => {
        const tempSettings = [...settings];
        tempSettings[e.target.dataset.setting]['minimums'][e.target.dataset.min][e.target.name] = e.target.value;
        setSettings(tempSettings);
    }
    const sendData = _ => {
        const body = { id, settings };
        const url = `/api/v1/league/${id}/updateSettings/`
        const reqDict = {
            method: 'POST',
            headers: {"content-type" : "application/json"},
            body: JSON.stringify(body)
        }
        fetch(url, reqDict).then(data => data.json()).then(json => {
            console.log(json);
            setRedirect(true);
        });
    }
    console.log(settings);
    if (redirect) return <Redirect to={'/league/' + id + '/'}></Redirect>
    return (
        <Container fluid>
            <Row>
                <LeagueButton id={id}></LeagueButton>
            </Row>
            <Row>
                <h2 className="ml-3">Scoring Settings</h2>
            </Row>
            {settings ? settings.map((setting, i) => {
                return (<Row key={i} className="mt-3 mb-5">
                    <Col sm={1} className="text-center">
                        <Button data-setting={i} onClick={handleRemoveSetting} variant="danger" size="sm">X</Button>
                    </Col>
                    <Col md={2}>
                        <Form.Control name="position" data-setting={i} as="select" defaultValue={setting.position} onChange={handleSettingChange}>
                            {positionTypes.map((type, j) => {
                                return <option value={type} key={j}>{type}</option>;
                            })}
                        </Form.Control>
                    </Col>
                    <Col md={1}>
                        <Form.Control name="points" data-setting={i} value={setting.points} onChange={handleSettingChange} type="text"></Form.Control> {setting.points === "1" ? "point" : "points"}
                    </Col>
                    <Col md={2}>
                        <Row>
                            <Col>
                                <Form.Control name="qualifier" data-setting={i} as="select" value={setting.category.qualifier || 'per'} onChange={handleCategoryChange}>
                                    <option value="per">per</option>
                                    <option value="greater than">greater than</option>
                                    <option value="between">between</option>
                                </Form.Control>
                            </Col>
                        </Row>
                        {settings[i].category.qualifier === 'between' ?  
                        <Row>
                            <Col>
                                <Form.Control name="threshold_1" data-setting={i} value={setting.category.threshold_1 || ''} onChange={handleCategoryChange} type="text"></Form.Control>
                            </Col>
                            {"and"}
                            <Col>
                                <Form.Control name="threshold_2" data-setting={i} value={setting.category.threshold_2 || ''} onChange={handleCategoryChange} type="text"></Form.Control>
                            </Col>
                        </Row> :
                        <Row>
                            <Col>
                                <Form.Control name="threshold" data-setting={i} value={setting.category.threshold || ''} onChange={handleCategoryChange} type="text"></Form.Control>
                            </Col>
                        </Row>}
                        <Row>
                            <Col>
                                <Form.Control name="statType" data-setting={i} as="select" defaultValue={setting.category.statType} onChange={handleCategoryChange}>
                                    {scoringTypes.map((type, i) => {
                                        return <option key={i} value={type}>{type}</option>
                                    })}
                                </Form.Control>
                            </Col>
                        </Row>
                    </Col>
                    {setting.minimums.map((min, j) => {
                        return (
                            <Col key={j} md={2}>
                                <Row>
                                    <Col>
                                        <span>Minimum:</span>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col>
                                        <Form.Control name="threshold" data-setting={i} data-min={j} value={min.threshold || ''} onChange={handleMinimumChange} type="text"></Form.Control>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col>
                                        <Form.Control name="statType" data-setting={i} data-min={j} as="select" defaultValue={min.statType} onChange={handleMinimumChange}>
                                            {scoringTypes.map((type, i) => {
                                                return <option key={i} value={type}>{type}</option>
                                            })}
                                        </Form.Control>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col className="text-center">
                                        <Button data-setting={i} data-min={j} variant="danger" onClick={handleRemoveMinimum}>X</Button>
                                    </Col>
                                </Row>
                            </Col>
                        );
                    })}
                    <Col sm={2}>
                        <Button data-setting={i} onClick={handleAddMinimum} className="mt-4" variant="primary">Add new minimum</Button>
                    </Col>
                </Row>
            )}) : ''}
            <Row className="justify-content-center">
                <Col className="ml-4">
                    <Button variant="primary" className="mt-4" onClick={handleAddSetting}>Add new setting</Button>
                </Col>
            </Row>
            <Row className="justify-content-center mt-4 mb-5">
                <Col className="ml-4">
                    <Button variant="success" onClick={sendData}>Submit</Button>
                </Col>
            </Row>
        </Container>
    )
}

export default ScoringSettings;