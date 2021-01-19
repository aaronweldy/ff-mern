import React, {useState, useEffect} from 'react'
import {Redirect, useParams} from 'react-router-dom'
import {Table, Alert, Container, Col, Row, DropdownButton, Dropdown, Button} from 'react-bootstrap'
import {useSelector} from 'react-redux'
import {selectUser} from '../Redux/userSlice.js'
import LeagueButton from './LeagueButton'
import '../CSS/LeaguePages.css'

export default function AdjustLineups() {
    const currUser = useSelector(selectUser);
    const {id} = useParams();
    const [teams, setTeams] = useState([]);
    const [isCommissioner, setIsCommissioner] = useState(false);
    const [lineupSettings, setLineupSettings] = useState({});
    const [success, setSuccess] = useState(false);
    useEffect(() => {
        async function fetchTeam() {
            const url = `/api/v1/league/${id}/`;
            const resp = await fetch(url);
            const data = await resp.json();
            setIsCommissioner(data.commissioners.includes(currUser.id));
            setTeams(data.teams);
            setLineupSettings(data.lineupSettings);
        }
        fetchTeam();
    }, [id, currUser]);
    const handlePlayerChange = (selectedPlayer, name, swapPlayer) => {
        if (name === "starters") {
            swapPlayer['lineup'] = selectedPlayer['lineup'];
            selectedPlayer['lineup'] = 'bench';
        }
        else {
            if(swapPlayer.name !== '') {
                swapPlayer['lineup'] = 'bench';
            }
            selectedPlayer['lineup'] = swapPlayer['lineup'];
        }
        setTeams([...teams]);
    };
    const handleBenchPlayer = (selectedPlayer, tableId) => {
        const playerToBench = {...selectedPlayer};
        const tempTeams = [...teams];
        playerToBench['lineup'] = 'bench';
        selectedPlayer['name'] = '';
        tempTeams[tableId]['players'].push(playerToBench);
        setTeams(tempTeams);
    }
    const submitLineups = _ => {
        const tempTeams = [...teams];
        for (const team of tempTeams) {
            team.players = team.players.filter(player => player.name !== '');
        }
        const url = `/api/v1/league/updateTeams/`;
        const body = {teams: tempTeams};
        const reqdict = {
            method : 'POST', 
            headers : {'content-type' : 'application/json'},
            body : JSON.stringify(body)
        };
        fetch(url, reqdict)
        .then(data => data.json())
        .then(json => {
            console.log(json); 
            setSuccess(true);
            setTimeout(() => setSuccess(false), 8000);
        });
    }
    if (teams && (teams.length && !isCommissioner)) return <Redirect to={"/league/" + id + "/"}></Redirect>;
    return (
        <Container id="small-left">
            <LeagueButton id={id}></LeagueButton>
            {teams ? teams.map((team, i) => {
                const starters = (Object.keys(lineupSettings).map(pos => {
                    return [...Array(parseInt(lineupSettings[pos])).fill().map(_ => { return {"position" : pos, "name" : '', "lineup" : pos} })];
                }).flat());
                console.log(lineupSettings);
                team.players.filter(player => player.lineup !== 'bench').forEach(starter => {
                    starters[starters.findIndex(player => player.position === starter.position && player.name === '')] = starter;
                });
                const bench = team.players.filter(player => player.lineup === 'bench');
                return (
                <Col key={i}>
                    <div>
                        <h2>{team.name}</h2>
                    </div>
                    <h4>Starters</h4>
                    <IterableTeamTable players={starters} tableId={i} oppPlayers={bench} name="starters" handleBenchPlayer={handleBenchPlayer} handlePlayerChange={handlePlayerChange}></IterableTeamTable>
                    <h4>Bench</h4>
                    <IterableTeamTable players={bench} tableId={i} oppPlayers={starters} name="bench" handleBenchPlayer={handleBenchPlayer} handlePlayerChange={handlePlayerChange}></IterableTeamTable>
                </Col>
                );
            }) : ''}
            <Col>
                <Button variant="success" className="mt-5 mb-2" onClick={submitLineups}>Submit Lineups</Button>
            </Col>
            {success ? <Row><Col sm={3}><Alert className="mb-3" variant="success">Submitted lineups!</Alert></Col></Row> : ''}
        </Container>
    );
}

function IterableTeamTable(props) {
    const {players, oppPlayers, name, tableId} = props;
    return (
    <Table striped bordered hover>
        <thead>
            <tr>
                <th style={{width: "5%"}}>Move</th>
                <th style={{width: "10%"}}>Position</th>
                <th style={{width: "40%"}}>Player Name</th>
            </tr>
        </thead>
        <tbody>
            {players.map((player, i) =>
            <tr key={i}>
                <td>
                    <DropdownButton name="position" title="">
                        {oppPlayers.filter(oppPlayer => oppPlayer.lineup.indexOf(player.position) >= 0 || player.lineup.indexOf(oppPlayer.position) >= 0).map((starter, j) => {
                            const swapPlayer = oppPlayers.findIndex(player => player.name === starter.name && player.position === starter.position);
                            return (
                            <Dropdown.Item key={j} onClick={ _ => props.handlePlayerChange(player, name, oppPlayers[swapPlayer], tableId)}>
                                {starter.lineup}: {starter.name}
                            </Dropdown.Item>
                            );
                        })}
                        {name === 'starters' && player.name !== '' ? <Dropdown.Item onClick={_ => props.handleBenchPlayer(player, tableId)}>{"bench"}</Dropdown.Item> : ''}
                    </DropdownButton>
                </td>
                <td>
                    <span>{name === 'starters' ? player.lineup : player.position}</span>
                </td>
                <td>
                    <span>{player.name}</span>
                </td>
            </tr>)}
        </tbody>
    </Table>
    );
}
