import {Table, Dropdown, DropdownButton} from 'react-bootstrap'

export default function TeamTable(props) {
    const {players, oppPlayers, name} = props;
    return (
    <Table striped bordered hover>
        <thead>
            <tr>
                <th style={{width: "5%"}}>Move</th>
                <th style={{width: "10%"}}>Position</th>
                <th style={{width: "20%"}}>Player Name</th>
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
                            <Dropdown.Item key={j} onClick={ _ => props.handlePlayerChange(i, name, swapPlayer)}>
                                {starter.lineup}: {starter.name}
                            </Dropdown.Item>
                            );
                        })}
                        {name === 'starters' && player.name !== '' ? <Dropdown.Item onClick={_ => props.handleBenchPlayer(player, i)}>{"bench"}</Dropdown.Item> : ''}
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