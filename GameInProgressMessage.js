function GameInProgressMessage(gameObj) {
  const yellowTeamScore = gameObj.yg.score + gameObj.yf.score;
  const blackTeamScore = gameObj.bg.score + gameObj.bf.score;
  
  return {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Yellow Team:* ${yellowTeamScore}`
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
              text: `G: ${gameObj.yg.name} ${gameObj.yg.score}`
            },
            value: "increment_yg_score"
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              emoji: true,
              text: `F: ${gameObj.yf.name} ${gameObj.yf.score}`
            },
            value: "increment_yf_score"
          }
        ]
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Black Team:* ${blackTeamScore}`
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
              text: `G: ${gameObj.bg.name} ${gameObj.bg.score}`
            },
            value: "increment_bg_score"
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              emoji: true,
              text: `F: ${gameObj.bf.name} ${gameObj.bf.score}`
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
          text: `Score: ${yellowTeamScore} - ${blackTeamScore}`
        },
        accessory: {
          type: "button",
          text: {
            type: "plain_text",
            text: "Finish Game",
            emoji: true
          },
          style: "primary",
          value: "complete_game"
        }
      }
    ]
  };
}
module.exports = GameInProgressMessage;
