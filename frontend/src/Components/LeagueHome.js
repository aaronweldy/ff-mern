import React, {useState, useEffect} from 'react'
import {useParams} from 'react-router-dom'
import {Table, Form} from 'react-bootstrap'

function LeagueHome() {
    const {id} = useParams();
    const [teams, setTeams] = useState([]);
    useEffect(() => {
        const url = `/api/v1/league/${id}/`;
        fetch(url)
        .then(resp => resp.json())
        .then(data => setTeams(data.teams));
    }, [id]);
    return(
    <Table striped bordered hover>
        <thead>
            <tr>
                <th>Team Name</th>
                <th>Team Owner</th>
                <th>Commissioner</th>
            </tr>
        </thead>
        <tbody>
            {teams.map((team, i) =>
            <tr key={i}>
                <td>
                    <span>{team.name}</span>
                </td>
                <td>
                    <span>{team.ownerName}</span>
                </td>
                <td>
                    <Form.Check checked={team.isCommissioner} disabled></Form.Check>
                </td>
            </tr>)}
        </tbody>
    </Table>);
}

export default LeagueHome;