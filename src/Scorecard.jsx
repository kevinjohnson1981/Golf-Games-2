import React, { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";

const STORAGE_KEY = "golf_scorecard_scores"; // Unique name for our storage



function Scorecard({ selectedCourse, selectedTee, gameFormat, playType, players, teamNames, matchLength }) {
  const teeData = Object.values(selectedCourse.tees).flat().find(
    (tee) => tee.tee_name === selectedTee
  );

  const scorecardRef = useRef(null); // This will "point" to our scorecard

  const numHoles = teeData.holes.length;

  const [scores, setScores] = useState(() => {
    const savedScores = localStorage.getItem(STORAGE_KEY);
    const emptyScores = players.map(() => Array(numHoles).fill("")); // Default empty scores
  
    if (savedScores) {
      try {
        const parsedScores = JSON.parse(savedScores);
        // Check if saved data matches current players and holes
        if (
          Array.isArray(parsedScores) &&
          parsedScores.length === players.length &&
          parsedScores.every(row => Array.isArray(row) && row.length === numHoles)
        ) {
          return parsedScores; // Use saved scores if valid
        }
      } catch (e) {
        console.error("Failed to parse saved scores:", e);
      }
    }
  
    return emptyScores; // If invalid or missing, return fresh empty scores
  });
  

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores)); // Save scores as a string
  }, [scores]); // Run this every time scores change  

  const handleScoreChange = (playerIndex, holeIndex, value) => {
    const newScores = [...scores];
    newScores[playerIndex][holeIndex] = value === "" ? "" : parseInt(value);
    setScores(newScores);
  };

  const getNetScore = (playerIndex, holeIndex) => {
    const gross = scores[playerIndex][holeIndex];
    const holeHandicap = teeData.holes[holeIndex].handicap;
    const playerHandicap = parseInt(players[playerIndex].handicap) || 0;
    if (gross === "" || isNaN(gross)) return "";
    let strokes = 0;
    if (playerHandicap >= holeHandicap) strokes = 1;
    if (playerHandicap >= holeHandicap + 18) strokes = 2;
    return gross - strokes;
  };

  const getTotalScore = (playerIndex) =>
    scores[playerIndex].reduce((sum, score) => sum + (parseInt(score) || 0), 0);

  const getTotalNetScore = (playerIndex) =>
    teeData.holes.reduce((sum, _, idx) => sum + (parseInt(getNetScore(playerIndex, idx)) || 0), 0);

  const getHoleWinner = (holeIndex) => {
    const netScores = players.map((_, idx) => getNetScore(idx, holeIndex));
    if (netScores.some((s) => s === "")) return "";
    const min = Math.min(...netScores);
    const winners = netScores.reduce((acc, s, idx) => (s === min ? [...acc, players[idx].name] : acc), []);
    return winners.length > 1 ? "Tie" : winners[0];
  };

  const getMatchStatus = () => {
    let p1Wins = 0, p2Wins = 0;
    teeData.holes.forEach((_, idx) => {
      const winner = getHoleWinner(idx);
      if (winner === players[0].name) p1Wins++;
      else if (winner === players[1].name) p2Wins++;
    });
    const diff = p1Wins - p2Wins;
    if (diff > 0) return `${players[0].name} is ${diff} Up`;
    if (diff < 0) return `${players[1].name} is ${Math.abs(diff)} Up`;
    return "All Square";
  };

  const getTeamMatchStatus = () => {
    let team1Wins = 0;
    let team2Wins = 0;
  
    teeData.holes.forEach((_, holeIndex) => {
      const winner = getTeamHoleWinner(holeIndex);
      if (winner === teamNames[0]) team1Wins++;
      else if (winner === teamNames[1]) team2Wins++;
    });
  
    const diff = team1Wins - team2Wins;
  
    if (diff > 0) return `${teamNames[0]} is ${diff} Up`;
    if (diff < 0) return `${teamNames[1]} is ${Math.abs(diff)} Up`;
    return "All Square";
  };

  const getStablefordPoints = (playerIndex, holeIndex) => {
    const net = getNetScore(playerIndex, holeIndex);
    const par = teeData.holes[holeIndex].par;
    if (net === "" || isNaN(net)) return "";
    const diff = net - par;
    if (diff >= 2) return 0;
    if (diff === 1) return 1;
    if (diff === 0) return 2;
    if (diff === -1) return 3;
    if (diff === -2) return 4;
    if (diff === -3) return 5;
    if (diff <= -4) return 6;
  };

  const getTotalStablefordPoints = (playerIndex) =>
    teeData.holes.reduce((sum, _, idx) => sum + (parseInt(getStablefordPoints(playerIndex, idx)) || 0), 0);

  const getStablefordLeader = () => {
    const points = players.map((_, idx) => getTotalStablefordPoints(idx));
    const max = Math.max(...points);
    const leaders = points.reduce((acc, p, idx) => (p === max ? [...acc, players[idx].name] : acc), []);
    return leaders.length > 1 ? "Tie" : `${leaders[0]} is leading`;
  };

  // Function to calculate best net score per hole for a team
  const getTeamBestScore = (playerIndexes, holeIndex) => {
    const netScores = playerIndexes.map((playerIdx) => getNetScore(playerIdx, holeIndex));
    const validScores = netScores.filter(s => s !== "");
    if (validScores.length === 0) return "";
    return Math.min(...validScores);
  };
  

// Function to calculate total team score (sum of best scores per hole)
const getTotalTeamScore = (playerIndexes) => {
  return teeData.holes.reduce((sum, _, holeIndex) => {
    const best = getTeamBestScore(playerIndexes, holeIndex);
    return sum + (parseInt(best) || 0);
  }, 0);
};

const getTeamHoleWinner = (holeIndex) => {
  const team1Best = getTeamBestScore([0, 1], holeIndex);
  const team2Best = getTeamBestScore([2, 3], holeIndex);

  if (team1Best === "" || team2Best === "") return ""; // No scores yet

  if (team1Best < team2Best) return teamNames[0]; // ✅ Team 1 name from input
  if (team2Best < team1Best) return teamNames[1]; // ✅ Team 2 name from input
  return "Tie";
};

const getGameStatus = () => {
  if (gameFormat === "match") {
    return `Match Status: ${playType === "Team" ? getTeamMatchStatus() : getMatchStatus()}`;
  } else if (gameFormat === "stableford") {
    return `Stableford: ${getStablefordLeader()}`;
  } else if (gameFormat === "stroke") {
    return "Stroke Play - See Scores Below";
  } else {
    return ""; // In case of undefined gameFormat
  }
};

const getFront9MatchStatus = () => {
  let p1Wins = 0, p2Wins = 0;
  for (let i = 0; i < 9; i++) {
    const winner = getHoleWinner(i);
    if (winner === players[0].name) p1Wins++;
    else if (winner === players[1].name) p2Wins++;
  }
  const diff = p1Wins - p2Wins;
  if (diff > 0) return `${players[0].name} is ${diff} Up (Front 9)`;
  if (diff < 0) return `${players[1].name} is ${Math.abs(diff)} Up (Front 9)`;
  return "All Square (Front 9)";
};

const getBack9MatchStatus = () => {
  if (teeData.holes.length < 18) return "Not available (course < 18 holes)";
  let p1Wins = 0, p2Wins = 0;
  for (let i = 9; i < 18; i++) {
    const winner = getHoleWinner(i);
    if (winner === players[0].name) p1Wins++;
    else if (winner === players[1].name) p2Wins++;
  }
  const diff = p1Wins - p2Wins;
  if (diff > 0) return `${players[0].name} is ${diff} Up (Back 9)`;
  if (diff < 0) return `${players[1].name} is ${Math.abs(diff)} Up (Back 9)`;
  return "All Square (Back 9)";
};

const getTeamFront9MatchStatus = () => {
  let team1Wins = 0, team2Wins = 0;
  for (let i = 0; i < 9; i++) { // First 9 holes
    const winner = getTeamHoleWinner(i);
    if (winner === teamNames[0]) team1Wins++;
    else if (winner === teamNames[1]) team2Wins++;
  }
  const diff = team1Wins - team2Wins;
  if (diff > 0) return `${teamNames[0]} is ${diff} Up (Front 9)`;
  if (diff < 0) return `${teamNames[1]} is ${Math.abs(diff)} Up (Front 9)`;
  return "All Square (Front 9)";
};

const getTeamBack9MatchStatus = () => {
  if (teeData.holes.length < 18) return "Not available (course < 18 holes)"; // Safety check
  let team1Wins = 0, team2Wins = 0;
  for (let i = 9; i < 18; i++) { // Back 9 holes
    const winner = getTeamHoleWinner(i);
    if (winner === teamNames[0]) team1Wins++;
    else if (winner === teamNames[1]) team2Wins++;
  }
  const diff = team1Wins - team2Wins;
  if (diff > 0) return `${teamNames[0]} is ${diff} Up (Back 9)`;
  if (diff < 0) return `${teamNames[1]} is ${Math.abs(diff)} Up (Back 9)`;
  return "All Square (Back 9)";
};

const handleDownloadImage = () => {
  if (scorecardRef.current) {
    const scrollableDivs = scorecardRef.current.querySelectorAll('.table-wrapper');

    // Save original styles
    const originalStyles = Array.from(scrollableDivs).map(div => ({
      maxHeight: div.style.maxHeight,
      overflow: div.style.overflow,
    }));

    // Expand each scrollable div
    scrollableDivs.forEach(div => {
      div.style.maxHeight = 'none'; // Remove height limit
      div.style.overflow = 'visible'; // Ensure all content shows
    });

    // Now capture the entire scorecard
    html2canvas(scorecardRef.current, { scale: 2 }).then((canvas) => {
      const link = document.createElement("a");
      link.download = "scorecard.png";
      link.href = canvas.toDataURL();
      link.click();

      // Restore original styles
      scrollableDivs.forEach((div, idx) => {
        div.style.maxHeight = originalStyles[idx].maxHeight;
        div.style.overflow = originalStyles[idx].overflow;
      });
    });
  }
};

const handleResetScores = () => {
  // Clear scores state (set everything back to empty)
  setScores(players.map(() => Array(numHoles).fill("")));

  // Also clear from localStorage
  localStorage.removeItem(STORAGE_KEY);

  alert("Scorecard has been reset!");
};


  return (
    <div>
      <div ref={scorecardRef}>
      <h2>Scorecard for {selectedCourse.course_name}</h2>
      <h3>Tee: {selectedTee}</h3>
      <h4>Game Format: {gameFormat === "match" ? "Match Play" : gameFormat === "stableford" ? "Stableford" : "Stroke Play"}</h4>
      <h4>Play Type: {playType === "team" ? "Team Play" : "Individual Play"}</h4>

      <h3 className="match-status">{getGameStatus()}</h3>

      {matchLength === "9-9" && gameFormat === "match" && playType === "team" &&(
        <>
          <h3 className="match-status">{getTeamFront9MatchStatus()}</h3>
          <h3 className="match-status">{getTeamBack9MatchStatus()}</h3>
        </>
      )}

      {matchLength === "9-9" && gameFormat === "match" && playType === "individual" && (
        <>
          <h3 className="match-status">{getFront9MatchStatus()}</h3>
          <h3 className="match-status">{getBack9MatchStatus()}</h3>
        </>
      )}

      

      
        {/* Player Totals Row Above Header */}
<div className="table-wrapper">
  <table className="header-table">
    <colgroup>
      <col style={{ width: '30px' }} /> {/* Hole */}
      <col style={{ width: '20px' }} /> {/* Par */}
      <col style={{ width: '30px' }} /> {/* Yards */}
      <col style={{ width: '25px' }} /> {/* HCP */}
      {players.map((_, idx) => (
        <col key={idx} style={{ width: '45px' }} />
      ))}
      <col style={{ width: '50px' }} /> {/* Winner */}
    </colgroup>
    <tbody>
      <tr>
        <td colSpan="4" style={{ textAlign: 'right', fontWeight: 'bold' }}>Total:</td>
        {players.map((_, idx) => (
          <td key={idx} style={{ fontWeight: 'bold' }}>
            {getTotalScore(idx)} / {getTotalNetScore(idx)}
            {gameFormat === "stableford" && ` / ${getTotalStablefordPoints(idx)} pts`}
          </td>
        ))}
        <td>-</td> {/* Empty cell for Winner column */}
      </tr>
    </tbody>
  </table>
</div>

        
        
        
      <div className="table-wrapper">
       {/* Header Table */}
    <table className="header-table">
    <colgroup>
    <col style={{ width: '30px' }} />
    <col style={{ width: '20px' }} />
    <col style={{ width: '30px' }} />
    <col style={{ width: '25px' }} />
    {players.map((_, idx) => (
      <col key={idx} style={{ width: '45px' }} />
    ))}
    <col style={{ width: '50px' }} />
  </colgroup>
      <thead>
        <tr>
        <th className="vertical-text">
          {"HOLE".split("").map((letter, idx) => (
            <span key={idx}>{letter}<br/></span>
          ))}
        </th>
        <th className="vertical-text">
          {"PAR".split("").map((letter, idx) => (
            <span key={idx}>{letter}<br/></span>
          ))}
        </th>
        <th className="vertical-text">
          {"YARDS".split("").map((letter, idx) => (
            <span key={idx}>{letter}<br/></span>
          ))}
        </th>
        <th className="vertical-text">
          {"HCP".split("").map((letter, idx) => (
            <span key={idx}>{letter}<br/></span>
          ))}
        </th>
        {players.map((p, idx) => (
          <th key={idx} className="player-column vertical-text">
            {p.name.split("").map((letter, lidx) => (
              <span key={lidx}>{letter}<br /></span>
            ))}
          </th>
        ))}
          <th className="vertical-text">
          {"WINNER".split("").map((letter, idx) => (
            <span key={idx}>{letter}<br/></span>
          ))}
        </th>
        </tr>
      </thead>
    </table>
    </div>
    <div className="table-wrapper">
    {/* Scrollable Body Table */}
    <div className="scrollable-body">
      <table className="body-table">
      <colgroup>
    <col style={{ width: '30px' }} />
    <col style={{ width: '20px' }} />
    <col style={{ width: '30px' }} />
    <col style={{ width: '25px' }} />
    {players.map((_, idx) => (
      <col key={idx} style={{ width: '45px' }} />
    ))}
    <col style={{ width: '50px' }} />
  </colgroup>
      <tbody>
  {teeData.holes.map((hole, holeIndex) => (
    <tr key={holeIndex}>
      <td>{holeIndex + 1}</td> {/* Hole number */}
      <td>{hole.par}</td>     {/* Par */}
      <td>{hole.yardage}</td> {/* Yardage */}
      <td>{hole.handicap}</td> {/* Handicap */}
      {players.map((_, playerIndex) => (
        <td key={playerIndex}>
          <input
            type="number"
            min="1"
            value={scores[playerIndex][holeIndex]}
            onChange={(e) => handleScoreChange(playerIndex, holeIndex, e.target.value)}
            className="score-input" // ✅ Now using your CSS class!
          />
          <div style={{ fontSize: "1em", color: "gray" }}>
            Net: {getNetScore(playerIndex, holeIndex)}
            {gameFormat === "stableford" && (
              <>
                <br />
                Pts: {getStablefordPoints(playerIndex, holeIndex)}
              </>
            )}
          </div>
        </td>
      ))}
      <td>
        {playType === "team" ? getTeamHoleWinner(holeIndex) : getHoleWinner(holeIndex)}
      </td>
    </tr>
  ))}
</tbody>




        
      </table>
      
      </div>
      
      </div>
      
      </div>
      <button onClick={handleDownloadImage} className="export-button">
        Download Scorecard as Image
      </button>
      <button onClick={handleResetScores} className="reset-button">
        Reset Scorecard
      </button>
  {/* Version footer */}
  <footer className="version-footer">
    <p>Golf Scorecard App — Version 1.0</p>
  </footer>

      </div>
  );
  };


  
export default Scorecard;
