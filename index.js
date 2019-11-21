require("dotenv").config();

var express = require("express");
var bodyParser = require("body-parser");

const StartGameMessage = require("./StartGameMessage");
const GameInProgressMessage = require("./GameInProgressMessage");
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
  return a;
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

controller.hears(
  "test",
  ["direct_mention", "mention", "direct_message"],
  function(bot, message) {
    console.log("here");
    bugger = controller.storage.teams.get("cool", error => console.log(error));
    console.log(bugger);
    console.log(controller.storage.teams);
    console.log(
      controller.storage.teams.all(cb => null),
      {}
    );
    bot.reply(message, "testing 1..2..3..");
  }
);

// Variables
let playersArray = [];
let GameInitiated = false;

controller.hears(
  "reset",
  ["direct_mention", "mention", "direct_message"],
  function(bot, message) {
    playersArray = [];
    GameInitiated = false;
    bot.reply(message, "$#%@ system error... Everything has been reset.");
  }
);

controller.hears(
  "play",
  ["direct_mention", "mention", "direct_message"],
  function(bot, message) {
    // const payload = JSON.parse(message.payload);
    // const username = payload.user.name;

    if (GameInitiated) {
      bot.reply(
        message,
        'A game has already been started, click "Join" if you want to play'
      );
    } else {
      GameInitiated = true;
      bot.reply(message, {
        attachments: [StartGameMessage([])]
      });
    }
  }
);

let foosGame = {
  yf: { name: "", score: 0 },
  yg: { name: "", score: 0 },
  bf: { name: "", score: 0 },
  bg: { name: "", score: 0 }
};

controller.on("interactive_message_callback", function(bot, message) {
  const payload = JSON.parse(message.payload);
  const username = payload.user.name;
  const action = message.actions[0].value;
  let updatedMessage = null;

  switch (action) {
    case "add_user_to_game":
      playersArray.push(username + playersArray.length);
      // playersArray.includes(username) || playersArray.length >= 4 ? null : playersArray.push(username);
      updatedMessage = StartGameMessage(playersArray);
      break;
    case "remove_user_from_game":
      playersArray = playersArray.includes(username)
        ? playersArray.filter(i => i !== username)
        : playersArray;
      updatedMessage = StartGameMessage(playersArray);
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
    default:
      updatedMessage = StartGameMessage(playersArray);
      break;
  }

  bot.replyInteractive(message, {
    attachments: [updatedMessage]
  });
});
