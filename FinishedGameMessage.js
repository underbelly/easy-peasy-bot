const axios = require('axios');
const resyncPlayerStats = require("./ResyncPlayerStats");


function FinishedGameMessage(gameObj, playerStats) {
  const winningMessage = () => {
    const yellowTeamScore = gameObj.yg.score + gameObj.yf.score;
    const blackTeamScore = gameObj.bg.score + gameObj.bf.score;

    if (yellowTeamScore > blackTeamScore) {
      return `*Winners* ${yellowTeamScore}pts\n` +
             `F: ${gameObj.yf.name} - ${gameObj.yf.score}\n` +
             `G: ${gameObj.yg.name} - ${gameObj.yg.score}\n` +
             `*Losers* ${blackTeamScore}pts\n` +
             `F: ${gameObj.bf.name} - ${gameObj.bf.score}\n` +
             `G: ${gameObj.bg.name} - ${gameObj.bg.score}.`;
    } else if(blackTeamScore > yellowTeamScore) {
      return `*Winners* ${blackTeamScore}pts\n` +
             `F: ${gameObj.bf.name} - ${gameObj.bf.score}\n` +
             `G: ${gameObj.bg.name} - ${gameObj.bg.score}\n` +
             `*Losers* ${yellowTeamScore}pts\n` +
             `F: ${gameObj.yf.name} - ${gameObj.yf.score}\n` +
             `G: ${gameObj.yg.name} - ${gameObj.yg.score}`;
    }
    return 'I guess it was a tie :man-shrugging:';
  }

  axios({
    method: 'post',
    url: 'https://us-central1-tablechamp-444aa.cloudfunctions.net/addScore',
    data: {
      FOOS_GAME: {
        players: {
          p1: gameObj.yg.name,
          p2: gameObj.yf.name,
          p3: gameObj.bg.name,
          p4: gameObj.bf.name,
        },
        teams: {
          t1: ["1","2"],
          t2: ["3","4"]
        },
        scores: {
          p1: gameObj.yg.score,
          p2: gameObj.yf.score,
          p3: gameObj.bg.score,
          p4: gameObj.bf.score,
        },
        positions: {
          p1: "G",
          p2: "F",
          p3: "G",
          p4: "F",
        }
      }
      }
  }).then((response) => {
    playerStats;
    resyncPlayerStats(playerStats);
    console.log('done hitting api', response);
  }).catch((error) => {
    console.log('err', error);
  })
  
  return ({
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: winningMessage()
        }
      }
    ]
  });
}

module.exports = FinishedGameMessage;
