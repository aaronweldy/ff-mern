import {Table, Dropdown, DropdownButton} from 'react-bootstrap'

export default function TeamTable(props) {
    const {players, oppPlayers, name, week, isOwner} = props;
    console.log(oppPlayers);
    return (
    <Table striped bordered hover>
        <thead>
            <tr>
                {isOwner ? <th>Move</th> : ''}
                <th>Position</th>
                <th>Player Name</th>
            </tr>
        </thead>
        <tbody>
            {players.map((player, i) =>
            <tr key={i}>
                {isOwner ?
                <td>
                    <DropdownButton name="position" title="">
                        {oppPlayers.filter(oppPlayer => oppPlayer.lineup[week].indexOf(player.position) >= 0 || player.lineup[week].indexOf(oppPlayer.position) >= 0).map((starter, j) => {
                            const swapPlayer = oppPlayers.findIndex(player => player.name === starter.name && player.position === starter.position);
                            return (
                            <Dropdown.Item key={j} onClick={ _ => props.handlePlayerChange(player, name, oppPlayers[swapPlayer])}>
                                {starter.lineup[week]}: {starter.name}
                            </Dropdown.Item>
                            );
                        })}
                        {name === 'starters' && player.name !== '' ? <Dropdown.Item onClick={_ => props.handleBenchPlayer(player, i)}>{"bench"}</Dropdown.Item> : ''}
                    </DropdownButton>
                </td> 
                : null}
                <td>
                    <span>{name === 'starters' ? player.lineup[week] : player.position}</span>
                </td>
                <td>
                    <span>{player.name}</span>
                </td>
            </tr>)}
        </tbody>
    </Table>
    );
}