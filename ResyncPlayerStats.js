var axios = require("axios");

function ResyncPlayerStats(playerStats) {
  const response = axios({
    method: "get",
    url: `https://us-central1-tablechamp-444aa.cloudfunctions.net/stats`
  })
    .then(response => {
      playerStats
      response.data.forEach(userStats => {
        playerStats[userStats.user] = userStats.stats;
      });
    })
    .catch(error => console.log(error));
  return playerStats;
}

module.exports = ResyncPlayerStats;
