import React, {useState, useCallback} from 'react'
import {Container, Col, Table, Form, Dropdown, DropdownButton, Button, Row, Image} from 'react-bootstrap'
import {Redirect} from 'react-router-dom'
import {useDropzone} from 'react-dropzone'
import {v4} from 'uuid'
import {storage} from '../firebase-config'

const positionTypes = ["QB", "RB", "WR", "TE", "K", "WR/RB", "WR/RB/TE", "QB/WR/RB/TE"];

function CreateLeague() {
    const [numTeams, setNumTeams] = useState(0);
    const [teams, setTeams] = useState([]);
    const [partTwo, setPartTwo] = useState(false);
    const [partThree, setPartThree] = useState(false);
    const [redirect, setRedirect] = useState(false);
    const [loading, setLoading] = useState(false);
    const [leagueName, setLeagueName] = useState('');
    const [posInfo, setPosInfo] = useState({});
    const [leagueId, setLeagueId] = useState(0);
    const [scoring, setScoring] = useState("Standard");
    const [imageUrl, setImageUrl] = useState(`${process.env.REACT_APP_DEFAULT_LOGO}`);

    const onDrop = useCallback(acceptedFiles => {
        const reader = new FileReader();
        reader.onload = (url => {
            setImageUrl(url.target.result);
        });
        reader.readAsDataURL(acceptedFiles[0]);
    }, [])

    const {getRootProps, getInputProps} = useDropzone({onDrop})

    function handleTeamChange(e) {
        const tempTeams = [...teams];
        if(e.target.name === 'isCommissioner') {
            tempTeams[e.target.dataset.id][e.target.name] = !tempTeams[e.target.dataset.id][e.target.name];
        }
        else tempTeams[e.target.dataset.id][e.target.name] = e.target.value;
        setTeams(tempTeams);
    }

    function handleSizeChange(evtKey, _) {
        setNumTeams(parseInt(evtKey));
        setTeams(Array(parseInt(evtKey)).fill().map((_, i) => ({teamName: 'Team ' + i, teamOwner: '', isCommissioner: false})));
    }

    function handleInfoChange(e) {
        const tempInfo = {...posInfo};
        tempInfo[e.target.name] = e.target.value;
        setPosInfo(tempInfo);
    }

    async function handleLeagueSubmission(e) {
        setLoading(true);
        const id = v4();
        const leagueRef = storage.ref().child(`logos/${id}`);
        if (imageUrl !== process.env.REACT_APP_DEFAULT_LOGO) {
            leagueRef.putString(imageUrl, 'data_url').then(async () => {
                const reqBody = {
                    "league": leagueName,
                    "teams": teams,
                    logo: id,
                    posInfo,
                    scoring
                }
                const resp = await fetch('/api/v1/league/create/', {method: 'POST', body: JSON.stringify(reqBody), headers: {'content-type' : 'application/json'}});
                const json = await resp.json();
                setLeagueId(json.id);
                setRedirect(true);
                setLoading(false);
            }).catch(e => {
                console.log(e);
            });
        }
        else {
            const reqBody = {
                "league": leagueName,
                "teams": teams,
                logo: process.env.REACT_APP_DEFAULT_LOGO,
                posInfo,
                scoring
            }
            const resp = await fetch('/api/v1/league/create/', {method: 'POST', body: JSON.stringify(reqBody), headers: {'content-type' : 'application/json'}});
            const json = await resp.json();
            setLeagueId(json.id);
            setRedirect(true);
            setLoading(false);
        }
    }

    if (redirect) {
        return <Redirect to={'/league/' + leagueId + '/'}></Redirect>
    }

    const subButton = partThree ? <Button variant="primary" onClick={handleLeagueSubmission}>&gt;&gt;</Button> : <Button variant="primary" onClick={_ => partTwo ? setPartThree(true) : setPartTwo(true)}>&gt;&gt;</Button>
    return (
        <Container>
            <Form.Row className="align-items-center mt-5">
                <Form.Label>League Name:</Form.Label>
                <Col sm={6}>
                    <Form.Control placeholder="My Fantasy League" onChange={e => setLeagueName(e.target.value)}></Form.Control>
                </Col>
            </Form.Row>
            <Form.Row className="align-items-center">
                <Form.Label>Select number of teams:</Form.Label>
                <DropdownButton variant="primary" className="m-3" title={numTeams} onSelect={handleSizeChange}>
                    {[...Array(15)].map((_, i) => <Dropdown.Item key={i} eventKey={i}>{i}</Dropdown.Item>)}
                </DropdownButton>
            </Form.Row>
            {partTwo ? 
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Team Name</th>
                        <th>Team Owner Email</th>
                        <th>Commissioner</th>
                    </tr>
                </thead>
                <tbody>
                    {teams.map((team, i) =>
                    <tr key={i}>
                        <td>
                            <input name="teamName" data-id={i} type="text" value={team.teamName} onChange={handleTeamChange}></input>
                        </td>
                        <td>
                            <input name="teamOwner" data-id={i} type="text" value={team.teamOwner} onChange={handleTeamChange}></input>
                        </td>
                        <td>
                            <Form.Check data-id={i} name="isCommissioner" onChange={handleTeamChange}></Form.Check>
                        </td>
                    </tr>)}
                </tbody>
            </Table> 
            : ''}
            {partThree ?
            <Form>
                <h4>Lineup Settings</h4>
                {positionTypes.map((type, i) => {
                return(
                    <Form.Group key={i} as={Row} md={6}>
                        <Col>
                            <Form.Label md={2}>{type}:</Form.Label>
                        </Col>
                        <Col md={1}>
                            <Form.Control data-id={i} name={type} onChange={handleInfoChange} size="md" type="text"></Form.Control>
                        </Col>
                    </Form.Group>
                )})}
                <hr></hr>
                <h4>Scoring Settings</h4>
                <Form.Group>
                    <Form.Check type="radio" name="scoring-setting" value="Standard" label="Standard" onClick={e => setScoring(e.target.value)} defaultChecked={scoring === "Standard"}></Form.Check>
                    <Form.Check type="radio" name="scoring-setting" value="PPR" label="PPR" onClick={e => setScoring(e.target.value)} defaultChecked={scoring === "PPR"}></Form.Check>
                    <Form.Check type="radio" name="scoring-setting" value="Custom" label="Custom" onClick={e => setScoring(e.target.value)} defaultChecked={scoring === "Custom"}></Form.Check>
                </Form.Group>
                <h4>League Logo</h4>
                <Row className="mb-3">
                        <div {...getRootProps({className : 'dropzone'})}>
                            <input {...getInputProps()}/>
                            Select or drop image here
                        </div>
                </Row>
                <Row>
                    <Image className="image-fit" src={imageUrl}></Image>
                </Row>
            </Form>
            : ''}
            <Form.Row className="mb-3 mt-3">{subButton}</Form.Row>
            {loading ? <div className="spinning-loader"></div> : ''}
        </Container>
    )
}

export default CreateLeague;