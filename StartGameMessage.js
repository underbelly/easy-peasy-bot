function StartGameMessage(players, playersBlock) {
  const getAddOptions = () => {
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
          text: "Add Players",
          emoji: true
        },
        options: playersBlock
      }
    };
  };
  const getStatus = () => {
    const openSpots = 4 - players.length;
    if (openSpots === 0) {
      return `*Status:* Ready to begin`;
    } else {
      return `*Status:* Looking for ${openSpots} more.`;
    }
  };
  const getChallengers = () => {
    if (players.length === 0) {
      return "*Waiting for Challengers...*";
    }
    let playerstring = players.join("\n• ");
    return `*Challengers:*\n• ${playerstring}`;
  };

  const getButtons = () => {
    if (players.length === 4) {
      return [
        {
          type: "button",
          text: {
            type: "plain_text",
            emoji: true,
            text: "Shuffle and Start Game"
          },
          style: "primary",
          value: "start_game"
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            emoji: true,
            text: "Cancel Game"
          },
          style: "danger",
          value: "cancel_game"
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            emoji: true,
            text: "Leave"
          },
          style: "danger",
          value: "remove_user_from_game"
        }
      ];
    } else {
      return [
        {
          type: "button",
          text: {
            type: "plain_text",
            emoji: true,
            text: "Join"
          },
          style: "primary",
          value: "add_user_to_game"
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            emoji: true,
            text: "Leave"
          },
          style: "danger",
          value: "remove_user_from_game"
        }
      ];
    }
  };

  return {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "A Foosball game is about to go down!"
        }
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: getChallengers()
          },
          {
            type: "mrkdwn",
            text: getStatus()
          }
        ]
      },
      getAddOptions(),
      {
        type: "actions",
        elements: getButtons()
      }
    ]
  };
}
module.exports = StartGameMessage;
