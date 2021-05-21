import React, {useState, useEffect} from 'react'
import {useParams} from 'react-router-dom'
import {Container, Col, Button, Alert, Row, Form, Image} from 'react-bootstrap'
import {auth} from '../firebase-config'
import TeamTable from './TeamTable'
import LeagueButton from './LeagueButton'
import ImageModal from './ImageModal'
import {storage} from '../firebase-config'
import {lineupSorter} from '../constants.js'
import '../CSS/LeaguePages.css'



function TeamPage() {
    const {id, leagueId} = useParams();
    const [team, setTeam] = useState(null);
    const [success, setSuccess] = useState(false);
    const [lineupSettings, setLineupSettings] = useState(null);
    const [showImageModal, setShowModal] = useState(false);
    const [week, setWeek] = useState(1);
    const [userIsOwner, setIsOwner] = useState(false);
    useEffect(() => {
        const url = `/api/v1/league/${leagueId}/team/${id}/`;
        const unsub = auth.onAuthStateChanged(async user => {
            if (user) {
                const resp = await fetch(url);
                const data = await resp.json();
                console.log(data.team);
                setTeam(data.team);
                setLineupSettings(data.lineupSettings);
                setIsOwner(data.team.owner === user.uid);
            }
        });
        return () => unsub();
    }, [week, leagueId, id]);
    const handlePlayerChange = (selectedPlayer, name, swapPlayer) => {
        if (name === "starters") {
            swapPlayer['lineup'][week] = selectedPlayer['lineup'][week];
            selectedPlayer['lineup'][week] = 'bench';
        }
        else {
            selectedPlayer['lineup'][week] = swapPlayer['lineup'][week];
            if(swapPlayer.name !== '') {
                swapPlayer['lineup'][week] = 'bench';
            }
        }
        setTeam({...team});
    };
    const handleBenchPlayer = (selectedPlayer) => {
        selectedPlayer['lineup'][week] = 'bench';
        setTeam({...team});
    }
    const handleImageSubmission = (imageUrl) => {
        storage.ref().child(team.id + "/logo").putString(imageUrl, "data_url").then(snapshot => {
            snapshot.ref.getDownloadURL().then(url => {
                setShowModal(false);
                const sendUrl = `/api/v1/league/updateTeamLogo/`;
                const body = {id, url};
                const reqdict = {
                    method : 'POST', 
                    headers : {'content-type' : 'application/json'},
                    body : JSON.stringify(body)
                };
                fetch(sendUrl, reqdict)
                .then(resp => {
                    return resp.json();
                }).then(data => {
                    setTeam(data.team);
                }).catch(e => console.log(e));
            });
        });
    }
    const sendUpdatedTeams = _ => {
        const url = `/api/v1/league/updateTeams/`;
        const body = {teams: [team], week};
        const reqdict = {
            method : 'POST', 
            headers : {'content-type' : 'application/json'},
            body : JSON.stringify(body)
        };
        fetch(url, reqdict)
        .then(data => data.json())
        .then(() => {
            setSuccess(true);
            setTimeout(() => setSuccess(false), 8000);
        });
    }
    let starters = [];
    let bench = [];
    if (team && lineupSettings) {
        starters = (Object.keys(lineupSettings).sort(lineupSorter).map(pos => {
            return [...Array(parseInt(lineupSettings[pos])).fill().map(() => { return {"position" : pos, "name" : '', "lineup" : [...Array(17).fill(pos)]} })];
        }).flat());
        team.players.filter(player => player.lineup[week] !== 'bench').forEach(starter => {
            starters[starters.findIndex(player => player.lineup[week] === starter.lineup[week] && player.name === '')] = starter;
        });
        bench = team.players.filter(player => player.lineup[week] === 'bench');
    }
    return (
        <Container>
            <ImageModal showImage={showImageModal} handleHide={() => setShowModal(!showImageModal)} handleImageSubmission={handleImageSubmission}></ImageModal>
            <Row>
                <LeagueButton id={leagueId}></LeagueButton>
            </Row>
            {team ?
            <>
            <Row className="mt-3 mb-3">
                <Col sm="auto">
                    <Image className="image-fit-height" src={team.logo || process.env.REACT_APP_DEFAULT_LOGO}></Image>
                </Col>
                <Col sm="auto">
                <h1 className="mt-2">
                    {team.name}
                    <div className="subtitle mb-3 mt-2">{team.ownerName}</div>
                </h1>
                </Col>
                {userIsOwner ?
                <Col className="mt-3">
                    <Button onClick={() => setShowModal(true)}>Change/Set Team Logo</Button>
                </Col>
                : null}
            </Row>
            <Row>
                <Form.Label className="mt-1">Week:</Form.Label>
                <Col sm="auto">
                <Form.Control as="select" defaultValue={week} onChange={e => setWeek(e.target.value)}>
                    {[...Array(17)].map((_, i) => {
                        return <option value={i+1} key={i}>{i+1}</option>;
                    })}
                </Form.Control>
                </Col>
            </Row>
            <Row>
                <h3>Starters</h3>
            </Row>
            <Row>
                <TeamTable isOwner={userIsOwner} players={starters} oppPlayers={bench} week={week} name="starters" handleBenchPlayer={handleBenchPlayer} handlePlayerChange={handlePlayerChange}></TeamTable>
            </Row>
            <Row>
                <h3>Bench</h3>
            </Row>
            <Row>
                <TeamTable isOwner={userIsOwner} players={bench} oppPlayers={starters} week={week} name="bench" handleBenchPlayer={handleBenchPlayer} handlePlayerChange={handlePlayerChange}></TeamTable>
            </Row>
            <Row>
                <Button className="mb-3 mt-2" variant="success" onClick={sendUpdatedTeams}>Submit Lineup</Button>
            </Row>
            {success ? <Row><Col sm={3}><Alert variant="success">Submitted lineup!</Alert></Col></Row> : ''}
            </>
            : ''}
        </Container>);
}

export default TeamPage;