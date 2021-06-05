import { Table, Dropdown, DropdownButton, SplitButton } from "react-bootstrap";

export default function TeamTable(props) {
  const { players, oppPlayers, name, week, isOwner } = props;
  console.log(players);
  return (
    <Table striped bordered hover>
      <thead>
        <tr>
          {isOwner ? <th>Move</th> : null}
          <th>Position</th>
          <th>Player Name</th>
          {isOwner && name === "starters" ? <th>Backup</th> : null}
        </tr>
      </thead>
      <tbody>
        {players.map((player, i) => (
          <tr key={i}>
            {isOwner ? (
              <td>
                <DropdownButton name="position" title="">
                  {oppPlayers
                    .filter(
                      (oppPlayer) =>
                        oppPlayer.lineup[week].indexOf(player.position) >= 0 ||
                        player.lineup[week].indexOf(oppPlayer.position) >= 0
                    )
                    .map((starter, j) => {
                      const swapPlayer = oppPlayers.findIndex(
                        (player) =>
                          player.name === starter.name &&
                          player.position === starter.position
                      );
                      return (
                        <Dropdown.Item
                          key={j}
                          onClick={() =>
                            props.handlePlayerChange(
                              player,
                              name,
                              oppPlayers[swapPlayer]
                            )
                          }
                        >
                          {starter.lineup[week]}: {starter.name}
                        </Dropdown.Item>
                      );
                    })}
                  {name === "starters" && player.name !== "" ? (
                    <Dropdown.Item
                      onClick={() => props.handleBenchPlayer(player, i)}
                    >
                      {"bench"}
                    </Dropdown.Item>
                  ) : null}
                </DropdownButton>
              </td>
            ) : null}
            <td>
              <span>
                {name === "starters" ? player.lineup[week] : player.position}
              </span>
            </td>
            <td>
              <span>{player.name}</span>
            </td>
            {isOwner && name === "starters" ? (
              <td>
                <SplitButton
                  name="backup"
                  title={player.backup ? player.backup[week] ?? "None" : "None"}
                  variant="secondary"
                >
                  {oppPlayers
                    .filter(
                      (oppPlayer) =>
                        oppPlayer.lineup[week].indexOf(player.position) >= 0 ||
                        player.lineup[week].indexOf(oppPlayer.position) >= 0
                    )
                    .map((starter, j) => {
                      const swapPlayer = oppPlayers.findIndex(
                        (player) =>
                          player.name === starter.name &&
                          player.position === starter.position
                      );
                      return (
                        <Dropdown.Item
                          key={j}
                          onClick={() =>
                            props.handlePlayerChange(
                              player,
                              "backup",
                              oppPlayers[swapPlayer]
                            )
                          }
                        >
                          {starter.name}
                        </Dropdown.Item>
                      );
                    })}
                  <Dropdown.Item
                    onClick={() =>
                      props.handlePlayerChange(player, "backup", {
                        name: "none",
                      })
                    }
                  >
                    None
                  </Dropdown.Item>
                </SplitButton>
              </td>
            ) : null}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
