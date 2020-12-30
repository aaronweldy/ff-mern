import React from 'react'

class TeamPage extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="container">
        <h1 className="jumbotron">Sample Team Page</h1>
        <a href="/">Go to home</a>
      </div>
    );
  }
}

export default TeamPage;