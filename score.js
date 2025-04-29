document.addEventListener('DOMContentLoaded', function() {
  const matchSetupForm = document.getElementById('matchSetupForm');
  
  matchSetupForm.addEventListener('submit', function(e) {
      e.preventDefault();
      

      const team1Name = document.getElementById('team1Name').value;
      const team2Name = document.getElementById('team2Name').value;
      const tossWinner = document.getElementById('tossWinner').value;
      const tossDecision = document.getElementById('tossDecision').value;
      

      if (!team1Name || !team2Name || !tossWinner || !tossDecision) {
          alert('Please fill in all fields');
          return;
      }
      
      let battingTeam, bowlingTeam;
      
      if (tossWinner === 'team1') {
          battingTeam = tossDecision === 'bat' ? team1Name : team2Name;
          bowlingTeam = tossDecision === 'bat' ? team2Name : team1Name;
      } else {
          battingTeam = tossDecision === 'bat' ? team2Name : team1Name;
          bowlingTeam = tossDecision === 'bat' ? team1Name : team2Name;
      }

       
const matchDetails = {
    team1Name,
    team2Name,
    tossWinner: tossWinner === 'team1' ? team1Name : team2Name,
    tossDecision,
    battingTeam,
    bowlingTeam,
    firstInningsTeam: tossDecision === 'bat' ? 
        (tossWinner === 'team1' ? team1Name : team2Name) : 
        (tossWinner === 'team1' ? team2Name : team1Name),
    secondInningsTeam: tossDecision === 'bat' ? 
        (tossWinner === 'team1' ? team2Name : team1Name) : 
        (tossWinner === 'team1' ? team1Name : team2Name),
    overs: 2,
    currentInnings: 1,
    innings1: {
        runs: 0,
        wickets: 0,
        overs: 0,
        balls: 0,
        extras: 0,
        batsmen: [],
        bowlers: []
    },
    innings2: {
        runs: 0,
        wickets: 0,
        overs: 0,
        balls: 0,
        extras: 0,
        batsmen: [],
        bowlers: []
    }
};
      
      localStorage.setItem('cricketMatchDetails', JSON.stringify(matchDetails));

      window.location.href = 'live.html';
  });
});

let matchDetails;
let currentBatters = [];
let currentBowler = null;
let previousBowler = null;
let isFirstInnings = true;
let commentaryEnabled = true;

document.addEventListener('DOMContentLoaded', function() {
    const savedMatch = localStorage.getItem('cricketMatchDetails');
    
    // if (!savedMatch) {
    //  
    //     const confirmSetup = confirm('No match details found. Would you like to go to setup page?');
    //     if (confirmSetup) {
    //         window.location.href = 'setup.html';
    //     }
    //     return;
    // }
    
    matchDetails = JSON.parse(savedMatch);
    isFirstInnings = matchDetails.currentInnings === 1;

    const innings = isFirstInnings ? 'innings1' : 'innings2';
    

    if (matchDetails[innings].batsmen && matchDetails[innings].batsmen.length > 0) {
        currentBatters = matchDetails[innings].batsmen.filter(b => !b.out).slice(0, 2);
        while (currentBatters.length < 2) {
            currentBatters.push({ name: 'New Batter', runs: 0, balls: 0, fours: 0, sixes: 0, out: false });
        }
    }
    

    if (matchDetails[innings].bowlers && matchDetails[innings].bowlers.length > 0) {
        currentBowler = matchDetails[innings].bowlers.reduce((prev, current) => 
            (prev.balls > current.balls) ? prev : current
        );
    }

    updateScoreDisplay();
    updateBattersTable();
    updateBowlerTable();

    document.getElementById('btn0').addEventListener('click', () => addRuns(0));
    document.getElementById('btn1').addEventListener('click', () => addRuns(1));
    document.getElementById('btn2').addEventListener('click', () => addRuns(2));
    document.getElementById('btn3').addEventListener('click', () => addRuns(3));
    document.getElementById('btn4').addEventListener('click', () => addRuns(4));
    document.getElementById('btn6').addEventListener('click', () => addRuns(6));
    document.getElementById('btnWicket').addEventListener('click', addWicket);
    document.getElementById('btnWide').addEventListener('click', addExtra.bind(null, 'wide'));
    document.getElementById('btnNoBall').addEventListener('click', addExtra.bind(null, 'noBall'));
    document.getElementById('btnScorecard').addEventListener('click', () => {
        window.location.href = 'scorecard.html';
    });
    
    const modal = document.getElementById('inputModal');
    const span = document.getElementsByClassName('close')[0];
    span.onclick = function() { modal.style.display = 'none'; }
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }

    if (isFirstInnings) {
        showInputModal('Enter Batter Names', [
            { label: 'Strike Batter Name:', id: 'strikeBatter' },
            { label: 'Non-Strike Batter Name:', id: 'nonStrikeBatter' },
            { label: 'First Bowler Name:', id: 'bowler' }
        ], initializeMatch);
    } else {

        initializeMatch();
    }
});

function initializeMatch(data) {
    if (data) {
    
        currentBatters = [
            { name: data.strikeBatter, runs: 0, balls: 0, fours: 0, sixes: 0, out: false },
            { name: data.nonStrikeBatter, runs: 0, balls: 0, fours: 0, sixes: 0, out: false }
        ];
        
        if (data.bowler) {
            currentBowler = { name: data.bowler, overs: 0, balls: 0, maidens: 0, runs: 0, wickets: 0 };
            const innings = isFirstInnings ? 'innings1' : 'innings2';
            matchDetails[innings].bowlers = [currentBowler];
        }
    } else {
        alert('Error initializing match. Please start again.');
        window.location.href = 'setup.html';
        return;
    }
    
    updateBattersTable();
    updateBowlerTable();
    saveMatchDetails();
}

function promptForBowler() {
    showInputModal('Enter Bowler Name', [
        { label: 'Bowler Name:', id: 'bowler' }
    ], (data) => {
        currentBowler = { name: data.bowler, overs: 0, balls: 0, maidens: 0, runs: 0, wickets: 0 };
        const innings = isFirstInnings ? 'innings1' : 'innings2';
        matchDetails[innings].bowlers.push(currentBowler);
        updateBowlerTable();
        saveMatchDetails();
    });
}

function addRuns(runs) {

    const commentaryMessages = {
        0: `${currentBatters[0].name} defends`,
        1: `${currentBatters[0].name} takes a single`,
        2: `${currentBatters[0].name} takes two runs`,
        3: `${currentBatters[0].name} takes three runs`,
        4: `FOUR! ${currentBatters[0].name} hits a boundary`,
        6: `SIX! ${currentBatters[0].name} with a maximum!`
    };
    addCommentary(commentaryMessages[runs]);
    const innings = isFirstInnings ? 'innings1' : 'innings2';
    
    matchDetails[innings].runs += runs;
    matchDetails[innings].balls++;
    currentBowler.runs += runs;
    currentBowler.balls++;
    

    currentBatters[0].runs += runs;
    currentBatters[0].balls++;
    if (runs === 4) currentBatters[0].fours++;
    if (runs === 6) currentBatters[0].sixes++;
    

    if (runs % 2 !== 0) {
        [currentBatters[0], currentBatters[1]] = [currentBatters[1], currentBatters[0]];
    }

    if (!isFirstInnings) {
        const target = matchDetails.innings1.runs + 1;
        if (matchDetails.innings2.runs >= target) {
            endInnings();
            return;
        }
    }

    checkOverCompletion();
    
    updateScoreDisplay();
    updateBattersTable();
    updateBowlerTable();
    saveMatchDetails();

    
}

function addWicket() {
    const innings = isFirstInnings ? 'innings1' : 'innings2';
    

    const outBatter = currentBatters[0];
    

    addCommentary(`OUT! ${outBatter.name} is dismissed for ${outBatter.runs} (${outBatter.balls} balls)`);

    matchDetails[innings].wickets++;
    matchDetails[innings].balls++;
    currentBowler.wickets++;
    currentBowler.balls++;
    
    outBatter.out = true;
    

    const outBatterIndex = matchDetails[innings].batsmen.findIndex(
        b => b.name === outBatter.name
    );
    if (outBatterIndex !== -1) {
        matchDetails[innings].batsmen[outBatterIndex] = outBatter;
    } else {
        matchDetails[innings].batsmen.push(outBatter);
    }

    if (matchDetails[innings].wickets >= 10 || isInningsComplete()) {
        endInnings();
        return;
    }
    

    const isOverComplete = (matchDetails[innings].balls % 6) === 0;
    

    showInputModal('New Batter', [
        { label: 'New Batter Name:', id: 'newBatter' }
    ], (data) => {
        const newBatter = { 
            name: data.newBatter, 
            runs: 0, 
            balls: 0, 
            fours: 0, 
            sixes: 0, 
            out: false 
        };
        
         
        currentBatters[0] = newBatter;
        
         
        updateScoreDisplay();
        updateBattersTable();
        updateBowlerTable();
        saveMatchDetails();
        
         
        if (isOverComplete) {
            completeOver();
        }
    });
}

function completeOver() {
    const innings = isFirstInnings ? 'innings1' : 'innings2';
    const overNumber = Math.floor(matchDetails[innings].balls / 6);
    
    addCommentary(`End of over ${overNumber}: ${matchDetails[innings].runs}/${matchDetails[innings].wickets}`);
    
     
    currentBowler.overs++;
    currentBowler.balls = 0;
    
     
    [currentBatters[0], currentBatters[1]] = [currentBatters[1], currentBatters[0]];
    
     
    if (isInningsComplete()) {
        endInnings();
        return;
    }
    
     
    promptForBowler();
}

function addExtra(type) {
    const innings = isFirstInnings ? 'innings1' : 'innings2';
    
     
    matchDetails[innings].runs += 1;
    matchDetails[innings].extras += 1;
    currentBowler.runs += 1;
    
     
    // if (type === 'noBall') {
    //     matchDetails[innings].balls--; // No ball doesn't count as a legal delivery
    // }
    
    

    updateScoreDisplay();
    updateBowlerTable();
    saveMatchDetails();
}

function checkOverCompletion() {
    const innings = isFirstInnings ? 'innings1' : 'innings2';
    const ballsInOver = matchDetails[innings].balls % 6;
    
    if (ballsInOver === 0 && matchDetails[innings].balls > 0) {
        completeOver();
    }
}

function isInningsComplete() {
    const innings = isFirstInnings ? 'innings1' : 'innings2';
    
     
    if (matchDetails[innings].wickets >= 10) {
        return true;
    }
    
     
    const completedOvers = Math.floor(matchDetails[innings].balls / 6);
    return completedOvers >= matchDetails.overs;
}

function endInnings() {
    if (isFirstInnings) {
         
        isFirstInnings = false;
        matchDetails.currentInnings = 2;
        
         
        matchDetails.firstInningsTeam = matchDetails.battingTeam;
        matchDetails.secondInningsTeam = matchDetails.bowlingTeam;

         
        matchDetails.battingTeam = matchDetails.secondInningsTeam;
        matchDetails.bowlingTeam = matchDetails.firstInningsTeam;
        
        addCommentary(`End of 1st innings: ${matchDetails.innings1.runs}/${matchDetails.innings1.wickets}`);
        
         
        showInputModal('Enter Second Innings Players', [
            { label: 'Strike Batter Name:', id: 'strikeBatter' },
            { label: 'Non-Strike Batter Name:', id: 'nonStrikeBatter' },
            { label: 'First Bowler Name:', id: 'bowler' }
        ], initializeMatch);
    } else {
         
        saveMatchDetails();
        window.location.href = 'summary.html';
    }
    
    updateScoreDisplay();
    saveMatchDetails();
}

function updateScoreDisplay() {
    const innings = isFirstInnings ? 'innings1' : 'innings2';
    const otherInnings = isFirstInnings ? null : matchDetails.innings1;
    
    const overs = Math.floor(matchDetails[innings].balls / 6);
    const balls = matchDetails[innings].balls % 6;
    const overStr = `${overs}.${balls}`;
    
     
    const battingTeam = isFirstInnings ? 
        (matchDetails.firstInningsTeam || matchDetails.battingTeam) : 
        (matchDetails.secondInningsTeam || matchDetails.bowlingTeam);
    
    const bowlingTeam = isFirstInnings ? 
        (matchDetails.secondInningsTeam || matchDetails.bowlingTeam) : 
        (matchDetails.firstInningsTeam || matchDetails.battingTeam);
    
    let scoreText;
    if (isFirstInnings) {
        scoreText = `${battingTeam} ${matchDetails[innings].runs}/${matchDetails[innings].wickets} (${overStr}) vs. ${bowlingTeam}`;
    } else {
        scoreText = `${battingTeam} ${matchDetails[innings].runs}/${matchDetails[innings].wickets} (${overStr}) vs. ${bowlingTeam} ${otherInnings.runs}/${otherInnings.wickets} (${matchDetails.overs}.0)`;
    }
    
    document.getElementById('scoreDisplay').textContent = scoreText;
    
    if (!isFirstInnings) {
        const crr = (matchDetails[innings].runs / (matchDetails[innings].balls / 6)).toFixed(2);
        const target = matchDetails.innings1.runs + 1;
        const runsNeeded = target - matchDetails[innings].runs;
        const ballsRemaining = matchDetails.overs * 6 - matchDetails[innings].balls;
        const rrr = ballsRemaining > 0 ? (runsNeeded / (ballsRemaining / 6)).toFixed(2) : 'N/A';
        
        document.getElementById('crrRrrDisplay').innerHTML = `
            <p>Current RR: ${crr} | Required RR: ${rrr}</p>
            <p>Target: ${target} | Need ${runsNeeded} runs from ${ballsRemaining} balls</p>
        `;
    } else {
        document.getElementById('crrRrrDisplay').innerHTML = '';
    }
}

function updateBattersTable() {
    const tbody = document.querySelector('#battersTable tbody');
    tbody.innerHTML = '';
    
    currentBatters.forEach(batter => {
         
        if (batter.out) return;
        
        const sr = batter.balls > 0 ? ((batter.runs / batter.balls) * 100).toFixed(2) : '0.00';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${batter.name}</td>
            <td>${batter.runs}</td>
            <td>${batter.balls}</td>
            <td>${batter.fours}</td>
            <td>${batter.sixes}</td>
            <td>${sr}</td>
        `;
        tbody.appendChild(row);
    });
}

function updateBowlerTable() {
    const tbody = document.querySelector('#bowlerTable tbody');
    tbody.innerHTML = '';
    
    if (!currentBowler) return;
    
    const economy = currentBowler.balls > 0 ? 
        (currentBowler.runs / (currentBowler.overs + currentBowler.balls/6)).toFixed(2) : '0.00';
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${currentBowler.name}</td>
        <td>${currentBowler.overs}.${currentBowler.balls}</td>
        <td>${currentBowler.maidens}</td>
        <td>${currentBowler.runs}</td>
        <td>${currentBowler.wickets}</td>
        <td>${economy}</td>
    `;
    tbody.appendChild(row);
}


function saveMatchDetails() {
    const innings = isFirstInnings ? 'innings1' : 'innings2';
    
     
    const allBatsmen = [...matchDetails[innings].batsmen];
    
     
    currentBatters.forEach(batter => {
        const existingIndex = allBatsmen.findIndex(b => b.name === batter.name);
        if (existingIndex !== -1) {
            allBatsmen[existingIndex] = batter;
        } else {
            allBatsmen.push(batter);
        }
    });
    
    matchDetails[innings].batsmen = allBatsmen;
    
     
    if (currentBowler) {
        const bowlerIndex = matchDetails[innings].bowlers.findIndex(b => b.name === currentBowler.name);
        if (bowlerIndex !== -1) {
            matchDetails[innings].bowlers[bowlerIndex] = currentBowler;
        } else {
            matchDetails[innings].bowlers.push(currentBowler);
        }
    }
    
    localStorage.setItem('cricketMatchDetails', JSON.stringify(matchDetails));
}

function showInputModal(title, fields, callback) {
    const modal = document.getElementById('inputModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modalSubmit = document.getElementById('modalSubmit');
    
     
    modalTitle.textContent = title;
    
     
    modalBody.innerHTML = '';
    fields.forEach(field => {
        const div = document.createElement('div');
        div.className = 'modal-field';
        div.innerHTML = `
            <label for="${field.id}">${field.label}</label>
            <input type="text" id="${field.id}" required>
        `;
        modalBody.appendChild(div);
    });
    
     
    const submitHandler = function() {
        const data = {};
        fields.forEach(field => {
            data[field.id] = document.getElementById(field.id).value;
        });
        modal.style.display = 'none';
        modalSubmit.removeEventListener('click', submitHandler);
        callback(data);
    };
    
    modalSubmit.addEventListener('click', submitHandler);
    modal.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', function() {
   
  const savedMatch = localStorage.getItem('cricketMatchDetails');

  
  const matchDetails = JSON.parse(savedMatch);
  
   
  document.getElementById('btnBackToLive').addEventListener('click', function() {

    localStorage.setItem('cricketMatchDetails', JSON.stringify(matchDetails));
      window.location.href = 'live.html';
  });
  
   
  const tabs = document.querySelectorAll('.tab-button');
  tabs.forEach(tab => {
      tab.addEventListener('click', function() {
           
          document.querySelectorAll('.tab-button').forEach(t => t.classList.remove('active'));
          document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
          
           
          this.classList.add('active');
          const innings = this.getAttribute('data-innings');
          document.getElementById(`innings${innings}`).classList.add('active');
      });
  });
  
   
  displayMatchInfo(matchDetails);
  
   
  displayInningsData(matchDetails, 1);
  displayInningsData(matchDetails, 2);
});

function displayMatchInfo(matchDetails) {
  const matchInfo = document.getElementById('matchInfo');
  
  let infoHTML = `
      <p><strong>Match:</strong> ${matchDetails.team1Name} vs ${matchDetails.team2Name}</p>
      <p><strong>Toss:</strong> ${matchDetails.tossWinner} chose to ${matchDetails.tossDecision}</p>
      <p><strong>Format:</strong> ${matchDetails.overs}-over match</p>
  `;
  
  if (matchDetails.currentInnings === 2 && matchDetails.innings1.runs) {
      infoHTML += `
          <p><strong>1st Innings:</strong> ${matchDetails.battingTeam} ${matchDetails.innings1.runs}/${matchDetails.innings1.wickets} (${matchDetails.overs}.0)</p>
          <p><strong>2nd Innings:</strong> ${matchDetails.bowlingTeam} ${matchDetails.innings2.runs}/${matchDetails.innings2.wickets} (${Math.floor(matchDetails.innings2.balls/6)}.${matchDetails.innings2.balls%6})</p>
      `;
      
      if (matchDetails.innings2.overs >= matchDetails.overs && matchDetails.innings2.balls % 6 === 0) {
           
          const target = matchDetails.innings1.runs + 1;
          if (matchDetails.innings2.runs >= target) {
              infoHTML += `<p><strong>Result:</strong> ${matchDetails.bowlingTeam} won by ${10 - matchDetails.innings2.wickets} wickets</p>`;
          } else {
              infoHTML += `<p><strong>Result:</strong> ${matchDetails.battingTeam} won by ${target - matchDetails.innings2.runs - 1} runs</p>`;
          }
      }
  }
  
  matchInfo.innerHTML = infoHTML;
}

function displayInningsData(matchDetails, inningsNum) {
  const innings = inningsNum === 1 ? matchDetails.innings1 : matchDetails.innings2;
  const isFirstInnings = inningsNum === 1;
  
   
  const titleElement = document.getElementById(`innings${inningsNum}Title`);
  if (titleElement) {
      titleElement.textContent = `${isFirstInnings ? matchDetails.battingTeam : matchDetails.bowlingTeam} ${innings.runs}/${innings.wickets} (${Math.floor(innings.balls/6)}.${innings.balls%6})`;
  }
  
   
  const battingTable = document.querySelector(`#batting${inningsNum} tbody`);
  if (battingTable) {
      battingTable.innerHTML = '';
      
      if (innings.batsmen && innings.batsmen.length > 0) {
          innings.batsmen.forEach(batter => {
              const sr = batter.balls > 0 ? ((batter.runs / batter.balls) * 100).toFixed(2) : '0.00';
              const row = document.createElement('tr');
              row.innerHTML = `
                  <td>${batter.name}</td>
                  <td>${batter.runs}</td>
                  <td>${batter.balls}</td>
                  <td>${batter.fours}</td>
                  <td>${batter.sixes}</td>
                  <td>${sr}</td>
                  <td>${batter.out ? 'Yes' : batter.balls > 0 ? 'Not out' : 'Did not bat'}</td>
              `;
              battingTable.appendChild(row);
          });
          
           
          const totalRow = document.createElement('tr');
          totalRow.className = 'total-row';
          totalRow.innerHTML = `
              <td><strong>Extras</strong></td>
              <td colspan="2">${innings.extras || 0} (w ${innings.extras || 0}, nb 0, b 0, lb 0)</td>
              <td colspan="4"><strong>Total</strong> ${innings.runs || 0}/${innings.wickets || 0} (${Math.floor(innings.balls/6)}.${innings.balls%6} overs)</td>
          `;
          battingTable.appendChild(totalRow);
      }
  }
  
   
  const bowlingTable = document.querySelector(`#bowling${inningsNum} tbody`);
  if (bowlingTable) {
      bowlingTable.innerHTML = '';
      
      if (innings.bowlers && innings.bowlers.length > 0) {
          innings.bowlers.forEach(bowler => {
              const economy = bowler.balls > 0 ? 
                  (bowler.runs / (bowler.overs + bowler.balls/6)).toFixed(2) : '0.00';
              const row = document.createElement('tr');
              row.innerHTML = `
                  <td>${bowler.name}</td>
                  <td>${bowler.overs}.${bowler.balls}</td>
                  <td>${bowler.maidens || 0}</td>
                  <td>${bowler.runs}</td>
                  <td>${bowler.wickets}</td>
                  <td>${economy}</td>
              `;
              bowlingTable.appendChild(row);
          });
      }
  }
}


//summary


 

 
document.addEventListener('DOMContentLoaded', function() {
     
    if (document.getElementById('resetMatch')) {
        displayMatchSummary();
        
         
        document.getElementById('resetMatch').addEventListener('click', resetMatch);
    }
});

function displayMatchSummary() {
    const savedMatch = localStorage.getItem('cricketMatchDetails');
    if (!savedMatch) {
        window.location.href = 'setup.html';
        return;
    }

    const matchDetails = JSON.parse(savedMatch);
    const resultContainer = document.getElementById('matchResult');
    const firstInningsDiv = document.getElementById('firstInningsSummary');
    const secondInningsDiv = document.getElementById('secondInningsSummary');

     
    const firstBattingTeam = matchDetails.firstInningsTeam || matchDetails.battingTeam;
    const secondBattingTeam = matchDetails.secondInningsTeam || matchDetails.bowlingTeam;

     
    displayInningsSummary(firstInningsDiv, matchDetails.innings1, firstBattingTeam, matchDetails.overs);
    displayInningsSummary(secondInningsDiv, matchDetails.innings2, secondBattingTeam, matchDetails.overs);

     
    if (matchDetails.currentInnings === 2) {
        const target = matchDetails.innings1.runs + 1;
        const runsScored = matchDetails.innings2.runs;
        const wicketsLost = matchDetails.innings2.wickets;
        const ballsLeft = (matchDetails.overs * 6) - matchDetails.innings2.balls;

        if (runsScored >= target) {
             
            resultContainer.innerHTML = `
                <p class="winner">${secondBattingTeam} wins by ${10 - wicketsLost} wickets (${ballsLeft} balls left)!</p>
                <p>${secondBattingTeam} chased ${target} in ${Math.floor(matchDetails.innings2.balls/6)}.${matchDetails.innings2.balls%6} overs</p>
            `;
        } else {
             
            resultContainer.innerHTML = `
                <p class="winner">${firstBattingTeam} wins by ${target - runsScored - 1} runs!</p>
                <p>${secondBattingTeam} scored ${runsScored}/${wicketsLost} in ${matchDetails.overs} overs</p>
            `;
        }
    }
}

function displayInningsSummary(container, innings, teamName, totalOvers) {
    const oversBowled = Math.floor(innings.balls / 6) + (innings.balls % 6) / 10;
    
    container.innerHTML = `
        <p><strong>${teamName}</strong></p>
        <p>${innings.runs}/${innings.wickets} in ${oversBowled.toFixed(1)} overs</p>
        <p>Run Rate: ${(innings.runs / (innings.balls / 6)).toFixed(2)}</p>
        <p>Extras: ${innings.extras || 0}</p>
    `;
}

function resetMatch() {
     
    localStorage.removeItem('cricketMatchDetails');
    
     
    window.location.href = 'setup.html';
}

//customization
function addCommentary(message) {
    if (!commentaryEnabled) return;
    
     
    if (typeof message !== 'string') {
        console.error('Invalid commentary message:', message);
        return;
    }

    const innings = isFirstInnings ? 'innings1' : 'innings2';
    const over = Math.floor(matchDetails[innings].balls / 6);
    const ball = (matchDetails[innings].balls % 6) + 1;
    
     
    const cleanMessage = message.replace(/[^\x20-\x7E]/g, '');

    const commentaryEntry = {
        displayOver: over,  
        displayBall: ball,  
        message: cleanMessage,
        timestamp: new Date().toLocaleTimeString(),
        score: `${matchDetails[innings].runs}/${matchDetails[innings].wickets}`
    };
    
    if (!matchDetails[innings].commentary) {
        matchDetails[innings].commentary = [];
    }
    
    matchDetails[innings].commentary.unshift(commentaryEntry);
    saveMatchDetails();
    updateCommentaryUI();
}


function updateCommentaryUI() {
    const commentaryList = document.getElementById('commentaryFeed');
    if (!commentaryList) return;
    
    const innings = isFirstInnings ? 'innings1' : 'innings2';
    commentaryList.innerHTML = '';
    
    if (matchDetails[innings]?.commentary?.length > 0) {
        matchDetails[innings].commentary.slice(0, 15).forEach(entry => {
             
            const safeOver = typeof entry.displayOver === 'number' ? entry.displayOver : 0;
            const safeBall = typeof entry.displayBall === 'number' ? entry.displayBall : 0;
            const safeScore = typeof entry.score === 'string' ? entry.score : '0/0';
            const safeMessage = typeof entry.message === 'string' 
                ? entry.message.replace(/[^\x20-\x7E]/g, '') 
                : 'Invalid message';

            const item = document.createElement('li');
            item.innerHTML = `
                <span class="over">${safeOver}.${safeBall}</span>
                <span class="score">${safeScore}</span>
                <span class="message">${safeMessage}</span>
            `;
            commentaryList.appendChild(item);
        });
    } else {
        commentaryList.innerHTML = '<li class="no-commentary">No commentary yet</li>';
    }
}