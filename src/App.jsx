import React, { useState } from "react";
import GolfCourseSelector from "./GolfCourseSelector.jsx";
import Scorecard from "./Scorecard.jsx";
import logo from './assets/logo.png'; // Adjust the path based on where you put it

function App() {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedTee, setSelectedTee] = useState(null);
  const [gameFormat, setGameFormat] = useState("");
  const [playType, setPlayType] = useState("");
  const [teamNames, setTeamNames] = useState(["", ""]); // Default team names
  const [playerCount, setPlayerCount] = useState(2); // Default to 2 players
  const [players, setPlayers] = useState([
    { name: "", handicap: "" },
    { name: "", handicap: "" },
    { name: "", handicap: "" },
    { name: "", handicap: "" },
  ]);
  const [matchLength, setMatchLength] = useState("18"); // Default 18-hole match

  return (
    <>
    <div className="app-header">
      <img src={logo} alt="App Logo" className="app-logo" />
    </div>

    <div className="container">
      {/* <h1>Thumbs Up Golf!</h1> */}
      <GolfCourseSelector
        setSelectedCourse={setSelectedCourse}
        setSelectedTee={setSelectedTee}
        selectedCourse={selectedCourse}
      />

      {selectedCourse && selectedTee && (
        <div>
          <h2>Game Setup</h2>
        <div className="form-row">
          <label>Select Number of Players:</label>
          <select value={playerCount} onChange={(e) => setPlayerCount(parseInt(e.target.value))}>
            <option value={2}>2 Players</option>
            <option value={3}>3 Players</option>
            <option value={4}>4 Players</option>
          </select>
        </div>
        <div className="form-row">
          <label>Game Format:</label>
          <select value={gameFormat} onChange={(e) => setGameFormat(e.target.value)}>
            <option value="">-- Choose Format --</option>
            <option value="stroke">Stroke Play</option>
            <option value="match">Match Play</option>
            <option value="stableford">Stableford</option>
          </select>
        </div>
        <div className="form-row">
          <label>Play Type:</label>
          <select value={playType} onChange={(e) => setPlayType(e.target.value)}>
            <option value="">-- Choose Play Type --</option>
            <option value="individual">Individual</option>
            <option value="team">Team</option>
          </select>
        </div>
        <div className="form-row">
          <label>Match Length:</label>
          <select value={matchLength} onChange={(e) => setMatchLength(e.target.value)}>
            <option value="18">18 Holes</option>
            <option value="9-9">Two 9-Hole Matches</option>
          </select>
        </div>

          {playType === "team" && playerCount < 4 && (
            <p style={{ color: "red" }}>⚠️ Team play requires 4 players. Please select 4 players above.</p>
          )}

          <h2>{playType === "team" ? "Team Information" : "Player Information"}</h2>

          {/* ✅ Show Team Name Inputs if Team Play */}
          {playType === "team" && (
            <div>
              <label>Team 1 Name:</label>
              <input
                type="text"
                className="team-input"
                value={teamNames[0]}
                placeholder="Enter Team 1 Name"
                onChange={(e) => {
                  const updatedTeams = [...teamNames];
                  updatedTeams[0] = e.target.value;
                  setTeamNames(updatedTeams);
                }}
                placeholder="Enter Team 1 Name"
              />
              <br />
              <label>Team 2 Name:</label>
              <input
                type="text"
                className="team-input"
                value={teamNames[1]}
                placeholder="Enter Team 2 Name"
                onChange={(e) => {
                  const updatedTeams = [...teamNames];
                  updatedTeams[1] = e.target.value;
                  setTeamNames(updatedTeams);
                }}
                placeholder="Enter Team 2 Name"
              />
              <br /><br />
            </div>
            
          )}

{players.slice(0, playerCount).map((player, index) => (
  <div key={index} className="player-info-row">
    <input
      type="text"
      className="player-input"
      value={player.name}
      placeholder={`Player ${index + 1} Name`}
      onChange={(e) => {
        const updatedPlayers = [...players];
        updatedPlayers[index].name = e.target.value;
        setPlayers(updatedPlayers);
      }}
    />

    <input
      type="number"
      className="handicap-input"
      value={player.handicap}
      placeholder="Handicap"
      onChange={(e) => {
        const updatedPlayers = [...players];
        updatedPlayers[index].handicap = e.target.value;
        setPlayers(updatedPlayers);
      }}
    />
  </div>
))}

        </div>
      )}

      {selectedCourse && selectedTee && gameFormat && playType &&
        players.slice(0, playerCount).every((p) => p.name !== "" && p.handicap !== "") && (
          <Scorecard
            selectedCourse={selectedCourse}
            selectedTee={selectedTee}
            gameFormat={gameFormat}
            playType={playType}
            players={players.slice(0, playerCount)}
            teamNames={teamNames}
            matchLength={matchLength} // ✅ Pass it down!
          />
      )}
      <footer className="version-footer">
    <p>Thumbs Up Golf App — Version 1.1</p>
  </footer>
    </div>
    

    </>
  );
}


export default App;
