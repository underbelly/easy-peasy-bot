require("dotenv").config();

import { App } from "@slack/bolt";
import { StartGameMessage } from "./StartGameMessage";
const GameInProgressMessage = require("./GameInProgressMessage");
const FinishedGameMessage = require("./FinishedGameMessage");
const {
  initializeGame,
  syncSlackUsers,
  swipSwapPositions,
} = require("./helpers/GameHelpers");

const resyncPlayerStats = require("./helpers/ResyncPlayerStats");

type SlackUsersType = { [key: string]: string };
type GameMode = "normal" | "swipswap";
type PlayerObj = {
  name: string;
  currPosition: "F" | "G";
  scoreForward: number;
  scoreGoal: number;
};
type GameObjType = {
  mode: GameMode;
  yellow: {
    score: number;
    p1: PlayerObj;
    p2: PlayerObj;
  };
  black: {
    score: number;
    p1: PlayerObj;
    p2: PlayerObj;
  };
};

const EMPTY_FOOS_GAME: GameObjType = {
  mode: "normal",
  yellow: {
    score: 0,
    p1: {
      name: "",
      currPosition: "F",
      scoreForward: 0,
      scoreGoal: 0,
    },
    p2: {
      name: "",
      currPosition: "G",
      scoreForward: 0,
      scoreGoal: 0,
    },
  },
  black: {
    score: 0,
    p1: {
      name: "",
      currPosition: "F",
      scoreForward: 0,
      scoreGoal: 0,
    },
    p2: {
      name: "",
      currPosition: "G",
      scoreForward: 0,
      scoreGoal: 0,
    },
  },
};

async function reSyncSlackUsers() {
  const slackUsersResponse = await syncSlackUsers();
  playersBlock = slackUsersResponse.playersBlock;
  slackUsers = slackUsersResponse.slackUsers;
}

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

(async () => {
  await app.start();
  console.log("⚡️ Bolt app started");
})();

app.event("channel_join", async ({ event, client }) => {
  console.log("channel join");
});

app.message("test", async ({ message, say }) => {
  await say(`testing 1,2,3`);
});

app.message("stats", async ({ message, say }) => {
  await say(`https://underbelly-foos.netlify.com/`);
});

app.message("reset", async ({ message, say }) => {
  playersArray = [];
  GameInitiated = false;
  foosGameObj = { ...EMPTY_FOOS_GAME };
  await say("$#%@ system error... Everything has been reset.");
});

app.message("sync", async ({ message, say }) => {
  reSyncSlackUsers();
  await say("resyncing slack users");
});

app.message("play", async ({ message, say }) => {
  if (GameInitiated) {
    await say(
      'A game has already been started, click "Join" if you want to play'
    );
  } else {
    GameInitiated = true;
    // @ts-ignore
    const userInitiatingGame = slackUsers[message.user];
    playersArray.push(userInitiatingGame);
    const newMessage = StartGameMessage(
      playersArray,
      playersBlock,
      playerStats
    );
    // @ts-ignore
    await say(newMessage);
  }
});

app.action("add_user_to_game", async ({ ack, respond, say, body }) => {
  // @ts-ignore
  const username = body.user.name;
  let updatedMessage = null;
  playersArray.includes(username) || playersArray.length >= 4
    ? null
    : playersArray.push(username);
  if (playersArray.length === 4) {
    // @ts-ignore
    await say({
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "Game is ready :foos:",
          },
        },
      ],
    });
  }
  updatedMessage = StartGameMessage(playersArray, playersBlock, playerStats);
  await respond(updatedMessage);
  await ack();
});

app.action(
  "multi_add_players",
  async ({ ack, respond, say, body, payload }) => {
    let updatedMessage = null;
    // @ts-ignore
    const newPlayersArray: Array<any> = payload.selected_options;
    newPlayersArray.forEach((player) => {
      const playerName = player.text.text;
      playersArray.includes(playerName) || playersArray.length >= 4
        ? null
        : playersArray.push(playerName);
    });
    updatedMessage = StartGameMessage(playersArray, playersBlock, playerStats);
    await respond(updatedMessage);
    await ack();
  }
);

app.action("remove_user_from_game", async ({ ack, respond, body }) => {
  // @ts-ignore
  const username = body.user.name;
  let updatedMessage = null;
  playersArray = playersArray.includes(username)
    ? playersArray.filter((i) => i !== username)
    : playersArray;
  updatedMessage = StartGameMessage(playersArray, playersBlock, playerStats);
  await respond(updatedMessage);
  await ack();
});

app.action("cancel_game", async ({ ack, respond, body }) => {
  let updatedMessage = null;
  playersArray = [];
  GameInitiated = false;
  foosGameObj = { ...EMPTY_FOOS_GAME };
  updatedMessage = {
    blocks: [
      {
        type: "section",
        // @ts-ignore
        text: {
          type: "mrkdwn",
          text: "Game has been canceled :cry:",
        },
      },
    ],
  };
  await respond(updatedMessage);
  await ack();
});

app.action("start_game_standard", async ({ ack, respond, body, say }) => {
  let updatedMessage = null;
  foosGameObj = await initializeGame("normal", playersArray, false);
  updatedMessage = GameInProgressMessage(foosGameObj);
  await respond(updatedMessage);
  await say("Game is underway");
  await ack();
});

app.action("start_game_swippy", async ({ ack, respond, body, say }) => {
  let updatedMessage = null;
  foosGameObj = await initializeGame("swipswap", playersArray, false);
  updatedMessage = GameInProgressMessage(foosGameObj);
  await respond(updatedMessage);
  await say("Game is underway");
  await ack();
});

app.action("increment_yg_score", async ({ ack, respond, body, say }) => {
  let updatedMessage = null;
  if (foosGameObj.yellow.score < 10) {
    const [_yellowForward, yellowGoalie] =
      foosGameObj.yellow.p1.currPosition === "F"
        ? [foosGameObj.yellow.p1, foosGameObj.yellow.p2]
        : [foosGameObj.yellow.p2, foosGameObj.yellow.p1];
    foosGameObj.yellow.score += 1;
    yellowGoalie.scoreGoal += 1;
    foosGameObj.mode === "swipswap"
      ? swipSwapPositions(foosGameObj, "yellow")
      : null;
  }
  updatedMessage = GameInProgressMessage(foosGameObj);
  await respond(updatedMessage);
  await ack();
});

app.action("increment_yf_score", async ({ ack, respond, body, say }) => {
  let updatedMessage = null;
  if (foosGameObj.yellow.score < 10) {
    const [yellowForward, _yellowGoalie] =
      foosGameObj.yellow.p1.currPosition === "F"
        ? [foosGameObj.yellow.p1, foosGameObj.yellow.p2]
        : [foosGameObj.yellow.p2, foosGameObj.yellow.p1];
    foosGameObj.yellow.score += 1;
    yellowForward.scoreForward += 1;
    foosGameObj.mode === "swipswap"
      ? swipSwapPositions(foosGameObj, "yellow")
      : null;
  }
  updatedMessage = GameInProgressMessage(foosGameObj);
  await respond(updatedMessage);
  await ack();
});

app.action("increment_bg_score", async ({ ack, respond, body, say }) => {
  let updatedMessage = null;
  if (foosGameObj.black.score < 10) {
    const [_blackForward, blackGoalie] =
      foosGameObj.black.p1.currPosition === "F"
        ? [foosGameObj.black.p1, foosGameObj.black.p2]
        : [foosGameObj.black.p2, foosGameObj.black.p1];
    blackGoalie.scoreGoal += 1;
    foosGameObj.black.score += 1;
    foosGameObj.mode === "swipswap"
      ? swipSwapPositions(foosGameObj, "black")
      : null;
  }
  updatedMessage = GameInProgressMessage(foosGameObj);
  await respond(updatedMessage);
  await ack();
});

app.action("increment_bf_score", async ({ ack, respond, body, say }) => {
  let updatedMessage = null;
  if (foosGameObj.black.score < 10) {
    const [blackForward, _blackGoalie] =
      foosGameObj.black.p1.currPosition === "F"
        ? [foosGameObj.black.p1, foosGameObj.black.p2]
        : [foosGameObj.black.p2, foosGameObj.black.p1];
    blackForward.scoreForward += 1;
    foosGameObj.black.score += 1;
    foosGameObj.mode === "swipswap"
      ? swipSwapPositions(foosGameObj, "black")
      : null;
  }
  updatedMessage = GameInProgressMessage(foosGameObj);
  await respond(updatedMessage);
  await ack();
});

app.action("complete_game", async ({ ack, respond, body, say }) => {
  let updatedMessage = null;
  updatedMessage = FinishedGameMessage(foosGameObj, playerStats);
  foosGameObj = { ...EMPTY_FOOS_GAME };
  playersArray = [];
  GameInitiated = false;
  await respond(updatedMessage);
  await ack();
});

app.action("complete_revenge", async ({ ack, respond, body, say }) => {
  // TODO: test implement
  let updatedMessage = null;
  let scoreBoardMessage = null;
  const [yellowForward, yellowGoalie] =
    foosGameObj.yellow.p1.currPosition === "F"
      ? [foosGameObj.yellow.p1, foosGameObj.yellow.p2]
      : [foosGameObj.yellow.p2, foosGameObj.yellow.p1];
  const [blackForward, blackGoalie] =
    foosGameObj.black.p1.currPosition === "F"
      ? [foosGameObj.black.p1, foosGameObj.black.p2]
      : [foosGameObj.black.p2, foosGameObj.black.p1];
  const revengePlayerOrder = [
    yellowForward.name,
    yellowGoalie.name,
    blackForward.name,
    blackGoalie.name,
  ];
  scoreBoardMessage = FinishedGameMessage(foosGameObj, playerStats);
  foosGameObj = await initializeGame("normal", revengePlayerOrder, true);
  updatedMessage = {
    blocks: [
      {
        type: "section",
        // @ts-ignore
        text: {
          type: "mrkdwn",
          text: "Revenge.",
        },
      },
    ],
  };
  await say(updatedMessage);
  updatedMessage = GameInProgressMessage(foosGameObj);
  await say(updatedMessage);
  updatedMessage = scoreBoardMessage;
  await respond(updatedMessage);
});

app.action("complete_revenge_swip", async ({ ack, respond, body, say }) => {
  // TODO: test implement
  let updatedMessage = null;
  let scoreBoardMessage = null;
  const [yellowForward, yellowGoalie] =
    foosGameObj.yellow.p1.currPosition === "F"
      ? [foosGameObj.yellow.p1, foosGameObj.yellow.p2]
      : [foosGameObj.yellow.p2, foosGameObj.yellow.p1];
  const [blackForward, blackGoalie] =
    foosGameObj.black.p1.currPosition === "F"
      ? [foosGameObj.black.p1, foosGameObj.black.p2]
      : [foosGameObj.black.p2, foosGameObj.black.p1];
  const revengePlayerOrder = [
    yellowForward.name,
    yellowGoalie.name,
    blackForward.name,
    blackGoalie.name,
  ];
  scoreBoardMessage = FinishedGameMessage(foosGameObj, playerStats);
  updatedMessage = {
    blocks: [
      {
        type: "section",
        // @ts-ignore
        text: {
          type: "mrkdwn",
          text: "Revenge Swippy Swappy.",
        },
      },
    ],
  };

  await say(updatedMessage);
  foosGameObj = await initializeGame("swipswap", revengePlayerOrder, true);
  updatedMessage = GameInProgressMessage(foosGameObj);
  await say(updatedMessage);
  updatedMessage = scoreBoardMessage;
  await respond(updatedMessage);
});

// Variables
let playersArray: Array<string> = [];
let GameInitiated = false;
// let foosGame = initializeGame();
const playerStats = {};
let playersBlock: Array<string> = [];
let slackUsers: SlackUsersType = {};

let foosGameObj: GameObjType = { ...EMPTY_FOOS_GAME };

// initializers
reSyncSlackUsers();
resyncPlayerStats(playerStats);
