require("dotenv").config();

var axios = require("axios");

const StartGameMessage = require("./StartGameMessage");
const GameInProgressMessage = require("./GameInProgressMessage");
const FinishedGameMessage = require("./FinishedGameMessage");

const resyncPlayerStats = require("./ResyncPlayerStats");
/**
 * A Bot for Slack!
 */

/**
 * Define a function for initiating a conversation on installation
 * With custom integrations, we don't have a way to find out who installed us, so we can't message them :(
 */

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return fixRandomizer(a);
}

// This swaps position if a player has played a position over 75% of the time
function fixRandomizer(a) {
  // order yg yf bg bf
  const p1stats = playerStats[a[0]];
  const p2stats = playerStats[a[1]];
  const p3stats = playerStats[a[2]];
  const p4stats = playerStats[a[3]];
  const p1PositionOccurance = p1stats.games !== 0 ? p1stats.games_goalie / p1stats.games : .5;
  const p2PositionOccurance = p2stats.games !== 0 ? p2stats.games_forward / p2stats.games : .5;
  const p3PositionOccurance = p3stats.games !== 0 ? p3stats.games_goalie / p3stats.games : .5;
  const p4PositionOccurance = p4stats.games !== 0 ? p4stats.games_forward / p4stats.games : .5;
  const switchTeam1 = (p1PositionOccurance > .75) || (p2PositionOccurance > .75);
  const switchTeam2 = (p3PositionOccurance > .75) || (p4PositionOccurance > .75);
  if (switchTeam1) {
    console.log('switching yellow team');
    const temp = a[0];
    a[0] = a[1];
    a[1] = temp;
  }
  if (switchTeam2) {
    console.log('switching black team');
    const temp = a[2];
    a[2] = a[3];
    a[3] = temp;
  }
}

function onInstallation(bot, installer) {
  if (installer) {
    bot.startPrivateConversation({ user: installer }, function(err, convo) {
      if (err) {
        console.log(err);
      } else {
        convo.say("I am a bot that has just joined your team");
        convo.say(
          "You must now /invite me to a channel so that I can be of use!"
        );
      }
    });
  }
}

/**
 * Configure the persistence options
 */

var config = {};
if (process.env.MONGOLAB_URI) {
  var BotkitStorage = require("botkit-storage-mongo");
  config = {
    storage: BotkitStorage({ mongoUri: process.env.MONGOLAB_URI })
  };
} else {
  config = {
    json_file_store: process.env.TOKEN
      ? "./db_slack_bot_ci/"
      : "./db_slack_bot_a/" //use a different name if an app or CI
  };
}

/**
 * Are being run as an app or a custom integration? The initialization will differ, depending
 */

if (process.env.TOKEN || process.env.SLACK_TOKEN) {
  //Treat this as a custom integration
  var customIntegration = require("./lib/custom_integrations");
  var token = process.env.TOKEN ? process.env.TOKEN : process.env.SLACK_TOKEN;
  var controller = customIntegration.configure(token, config, onInstallation);
} else if (
  process.env.CLIENT_ID &&
  process.env.CLIENT_SECRET &&
  process.env.PORT
) {
  //Treat this as an app
  var app = require("./lib/apps");
  var controller = app.configure(
    process.env.PORT,
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    config,
    onInstallation
  );
} else {
  console.log(
    "Error: If this is a custom integration, please specify TOKEN in the environment. If this is an app, please specify CLIENTID, CLIENTSECRET, and PORT in the environment"
  );
  process.exit(1);
}

controller.on("rtm_open", function(bot) {
  console.log("** The RTM api just connected!");
});

controller.on("rtm_close", function(bot) {
  console.log("** The RTM api just closed");
  // you may want to attempt to re-open
});

/**
 * Core bot logic goes here!
 */
// BEGIN EDITING HERE!

controller.on("bot_channel_join", function(bot, message) {
  bot.reply(message, "I'm back from the dead!");
});



// Variables
let playersArray = [];
let GameInitiated = false;
let foosGame = initializeGame();
let slackUsers = {};
let playersBlock = [];
const playerStats = {};

function initializeGame() {
  return {
    yf: { name: "", score: 0 },
    yg: { name: "", score: 0 },
    bf: { name: "", score: 0 },
    bg: { name: "", score: 0 }
  };
}

controller.hears(
  "test",
  ["direct_mention", "mention", "direct_message"],
  function(bot, message) {
    console.log(playerStats);
    bot.reply(message, "testing 1..2..3..");
  }
);

const syncSlackUsers = async () => {
  const response = await axios({
    method: 'get',
    url: `https://slack.com/api/users.list?token=${process.env.SLACK_SYNC_TOKEN}&pretty=1`,
  }).then(response => response.data).catch((error) => console.log(error));
  response.members
    .filter(mem => {
      const { deleted, is_bot, is_app_user, is_restricted, name } = mem;
      if (deleted || is_bot || is_app_user || is_restricted) return false;
      if (name === "slackbot") return false;
      return true;
    })
    .forEach(user => {
      slackUsers[user.id] = user.name;
      playersBlock.push({
        text: {
          type: "plain_text",
          text: user.name,
          emoji: true
        },
        value: user.name
      });
    });;
}

controller.hears(
  "reset",
  ["direct_mention", "mention", "direct_message"],
  function(bot, message) {
    playersArray = [];
    GameInitiated = false;
    bot.reply(message, "$#%@ system error... Everything has been reset.");
  }
);

syncSlackUsers();
resyncPlayerStats(playerStats);

controller.hears(
  "add",
  ["direct_mention", "mention", "direct_message"],
  function(bot, message) {
    const cleanText = message.text.replace(/[^\w\s!?]/g, '');
    const players = cleanText.split(' ').splice(1);

    players.forEach(playerId => {
      playerName = slackUsers[playerId]
      playersArray.includes(playerName) || playersArray.length >= 4 ? null : playersArray.push(playerName);
    });

    bot.reply(message, {
      attachments: [StartGameMessage(playersArray, playersBlock, playerStats)]
    });
  }
);

controller.hears(
  "play",
  ["direct_mention", "mention", "direct_message"],
  function(bot, message) {
    if (GameInitiated) {
      bot.reply(
        message,
        'A game has already been started, click "Join" if you want to play'
      );
    } else {
      GameInitiated = true;
      userInitiatingGame = slackUsers[message.user]
      playersArray.push(userInitiatingGame)
      bot.reply(message, {
        attachments: [StartGameMessage(playersArray, playersBlock, playerStats)]
      });
    }
  }
);

controller.on("interactive_message_callback", function(bot, message) {
  const payload = JSON.parse(message.payload);
  const username = payload.user.name;
  const action = message.actions[0].value || 'multi_static_select';
  let updatedMessage = null;

  switch (action) {
    case "add_user_to_game":
      // playersArray.push(username + playersArray.length);
      playersArray.includes(username) || playersArray.length >= 4 ? null : playersArray.push(username);
      updatedMessage = StartGameMessage(playersArray, playersBlock, playerStats);
      break;
    case "multi_static_select":
      newPlayersArray = payload.actions[0].selected_options
      newPlayersArray.forEach(player => {
        playerName = player.text.text;
        playersArray.includes(playerName) || playersArray.length >= 4 ? null : playersArray.push(playerName);
      })
      updatedMessage = StartGameMessage(playersArray, playersBlock, playerStats);
      break;
    case "remove_user_from_game":
      playersArray = playersArray.includes(username)
        ? playersArray.filter(i => i !== username)
        : playersArray;
      updatedMessage = StartGameMessage(playersArray, playersBlock, playerStats);
      break;
    case "cancel_game":
      playersArray = [];
      GameInitiated = false;
      updatedMessage = {
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "Game has been canceled"
            }
          }
        ]
      };
      break;
    case "start_game":
      shuffle(playersArray);
      foosGame.yg.name = playersArray[0];
      foosGame.yf.name = playersArray[1];
      foosGame.bg.name = playersArray[2];
      foosGame.bf.name = playersArray[3];
      updatedMessage = GameInProgressMessage(foosGame);
      bot.reply(message, {
        attachments: [updatedMessage]
      });
      updatedMessage = {
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "Game is underway"
            }
          }
        ]
      };
      break;
    case "increment_yg_score":
      foosGame.yg.score += 1;
      updatedMessage = GameInProgressMessage(foosGame);
      break;
    case "increment_yf_score":
      foosGame.yf.score += 1;
      updatedMessage = GameInProgressMessage(foosGame);
      break;
    case "increment_bg_score":
      foosGame.bg.score += 1;
      updatedMessage = GameInProgressMessage(foosGame);
      break;
    case "increment_bf_score":
      foosGame.bf.score += 1;
      updatedMessage = GameInProgressMessage(foosGame);
      break;
    case "complete_game":
      updatedMessage = FinishedGameMessage(foosGame);
      foosGame = initializeGame();
      playersArray = [];
      GameInitiated = false;
      break;
    default:
      updatedMessage = StartGameMessage(playersArray, playersBlock, playerStats);
      break;
  }

  bot.replyInteractive(message, {
    attachments: [updatedMessage]
  });
});
