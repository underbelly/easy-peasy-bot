function GameInProgressMessage(game) {
  const yellowTeamScore = game.yg.score + game.yf.score;
  const blackTeamScore = game.bg.score + game.bf.score;
  
  return {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Yellow Team: ${yellowTeamScore}`
        }
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              emoji: true,
              text: `G: ${game.yg.name} ${game.yg.score}`
            },
            value: "increment_yg_score"
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              emoji: true,
              text: `F: ${game.yf.name} ${game.yf.score}`
            },
            value: "increment_yf_score"
          }
        ]
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Black Team: ${blackTeamScore}`
        }
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              emoji: true,
              text: `G: ${game.bg.name} ${game.bg.score}`
            },
            value: "increment_bg_score"
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              emoji: true,
              text: `F: ${game.bf.name} ${game.bf.score}`
            },
            value: "increment_bf_score"
          }
        ]
      },
      {
        type: "divider"
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Score: 7 - 5"
        },
        accessory: {
          type: "button",
          text: {
            type: "plain_text",
            text: "Finish Game",
            emoji: true
          },
          style: "primary",
          value: "complete game"
        }
      }
    ]
  };
}
module.exports = GameInProgressMessage;
