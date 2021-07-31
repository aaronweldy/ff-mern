# Orca Fantasy Football

Personal project to create a season-long, total-score-based fantasy football platform. Gained experience in React, Redux, Node.js, Express, Firebase, MongoDB, authentication with JWT, and more over the course of the project.

## Features

- **Season-long, customizable leagues**: run a league with almost any combination of scoring settings & teams.  
- **Flexible scoring system**: Run your league your way, with fully customizable scoring settings for supported stats.  
- **Commissioner support**: Edit any aspect of your league after it's been created, from the number of teams to setting the scores each week.
- **User customization**: Personalize your team and league with uploadable logos
- **Detailed scoring breakdown**: See how each team performed each week, with a breakdown table of exactly where their points came from

## Run the website
- **Client**:
  - Create a **.env** file with the values `REACT_APP_PUBLIC_URL`, `REACT_APP_BACKEND_URL`, `REACT_APP_DEFAULT_LOGO` provided
  - npm start
- **Server**
  - Set up a firebase project & create a firebase config file
  - **firebase serve**
