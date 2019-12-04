function addPlayersBlock(players) {
  console.log('in here', players)
  const playerOptions = () => {
    players.map(player => {
      return {
        text: {
          type: "plain_text",
          text: player,
          emoji: true
        },
        value: player
      };
    });
  };

  return {
    type: "section",
    text: {
      type: "mrkdwn",
      text: "Add Players"
    },
    accessory: {
      type: "multi_static_select",
      placeholder: {
        type: "plain_text",
        text: "Select Players",
        emoji: true
      },
      options: [playerOptions()]
    }
  };
}

module.exports = addPlayersBlock;
