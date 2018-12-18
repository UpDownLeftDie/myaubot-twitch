'use strict';
const _ = require('lodash');
if (_.get(process, 'env.NODE_ENV') !== 'production') {
  require('dotenv').load();
}
const TwitchJS = require('twitch-js');
const FileSync = require('lowdb/adapters/FileSync');
const lowdb = require('lowdb');

const adapter = new FileSync(`${__dirname}/db.json`);
const db = lowdb(adapter);

// load settings from env
const {
  BOT_USERNAME,
  BOT_OAUTH,
  BASE_SUCCESS_RATE,
  WORD_GROWTH_SUCCESS_RATE,
} = _.get(process, 'env');
console.log(BOT_USERNAME);
if (!BOT_USERNAME) {
  // should be a twitch username
  console.error('MISSING USERNAME');
  return;
} else if (!BOT_OAUTH) {
  // should be an oauth for the account above
  console.error('MISSING PASSWORD');
  return;
} else if (!BASE_SUCCESS_RATE) {
  // should be a precent in decimal form
  console.error('MISSING BASE_SUCCESS_RATE');
  return;
} else if (!WORD_GROWTH_SUCCESS_RATE) {
  // should be a precent in decimal form
  console.error('MISSING WORD_GROWTH_SUCCESS_RATE');
  return;
}

// Dictionary of words to catified words
const WORDS = require('./words.json');
// finds all words that match in the dictionarty, case-insensitive
const MATCHER = new RegExp(`\\b(?:${Object.keys(WORDS).join('|')})\\b`, 'gi');
// example: \b(?:now|perfect|pause)\b

// join self-channel by default
db.defaults({ channels: ['#myaubot'], ignoredUsers: [] }).write();
let ignoredUsers = [];
loadIgnoredUsers().then(results => {
  ignoredUsers = results;
  initalizeTwitchClient();
});

function initalizeTwitchClient() {
  const channels = db.get('channels').value();

  const twitchClientOptions = {
    options: {
      debug: false,
    },
    connection: {
      reconnect: true,
    },
    identity: {
      username: BOT_USERNAME,
      password: BOT_OAUTH,
    },
    channels: channels,
  };

  const client = new TwitchJS.client(twitchClientOptions);

  // Check messages that are posted in twitch chat
  client.on('message', async (channel, userstate, message, self) => {
    const { username } = userstate;
    // const debugMessage = {
    //   channel,
    //   userstate,
    //   message,
    // };
    // console.log('NEW MESSAGE:\n', debugMessage);

    // Don't listen to my own messages..
    if (self) return;
    // Handle different message types..
    switch (userstate['message-type']) {
      case 'action':
        // This is an action message..
        break;
      case 'chat':
        if (message.toLowerCase().indexOf('!meowify') === 0) {
          joinChannel(client, username);
        } else if (message.toLowerCase().indexOf('!unmeowify') === 0) {
          leaveChannel(client, username);
        } else if (message.toLowerCase().indexOf('!hiss') === 0) {
          ignoreUser(client, username);
        } else if (message.toLowerCase().indexOf('!patpat') === 0) {
          unignoreUser(client, username);
        } else if (!checkIfUserIsIgnored(username)) {
          meowify(client, message, channel);
        }
        break;
      case 'whisper':
        if (message.toLowerCase().indexOf('!meowify') === 0) {
          joinChannel(client, username);
        } else if (message.toLowerCase().indexOf('!unmeowify') === 0) {
          leaveChannel(client, username);
        } else if (message.toLowerCase().indexOf('!hiss') === 0) {
          ignoreUser(client, username);
        } else if (message.toLowerCase().indexOf('!patpat') === 0) {
          unignoreUser(client, username);
        }
        break;
      default:
        // Something else ?
        break;
    }
  });

  // Connect the client to the server..
  client.connect();
}

async function meowify(client, message, channel) {
  const matchCount = ((message || '').match(MATCHER) || []).length;
  // const matcherTestResults = MATCHER.test(message);
  if (matchCount > 0) {
    const newMessage = message.replace(MATCHER, function(match) {
      return WORDS[match.toLowerCase()];
    });

    const a = BASE_SUCCESS_RATE / WORD_GROWTH_SUCCESS_RATE;
    const b = WORD_GROWTH_SUCCESS_RATE;
    const x = matchCount;
    const successRate = a * Math.pow(b, x);
    if (newMessage !== message && successRate - Math.random() > 0) {
      client.say(channel, newMessage);
    }
  }
}

// joins a new channel and saves it to the database
async function joinChannel(client, username) {
  db.get('channels')
    .push(`#${username}`)
    .write();

  return client
    .join(username)
    .then(() => {
      client.whisper(
        username,
        `I will now meowify messages in ${username}'s chat'`,
      );
    })
    .catch(err => {
      client.whisper(
        username,
        `Something went cat-astrophic! Message my owner: UpDownLeftDie`,
      );
      console.error(`Error joning channel: ${username}`, err);
    });
}

// leaves channel and removes it to the database
async function leaveChannel(client, username) {
  db.get('channels')
    .pull(`#${username}`)
    .write();

  return client
    .leave(username)
    .then(() => {
      client.whisper(
        username,
        `I will no longer meowify messages in ${username}'s chat'`,
      );
    })
    .catch(err => {
      client.whisper(
        username,
        `Something went cat-astrophic! Message my owner: UpDownLeftDie`,
      );
      console.error(`Error leaving channel: ${username}`, err);
    });
}

async function loadIgnoredUsers() {
  return db.get('ignoredUsers').value();
}

async function ignoreUser(client, username) {
  let isUserIgnored = checkIfUserIsIgnored(username);
  if (!isUserIgnored) {
    db.get('ignoredUsers')
      .push(username)
      .write();
    ignoredUsers = await loadIgnoredUsers();
    isUserIgnored = checkIfUserIsIgnored(username);
    if (isUserIgnored) {
      client.whisper(username, `I won't paw at your messages any more :3`);
    }
  }
  if (!isUserIgnored) {
    client.whisper(
      username,
      `Something went cat-astrophic! Message my owner: UpDownLeftDie`,
    );
  }
}

async function unignoreUser(client, username) {
  db.get('ignoredUsers')
    .pull(username)
    .write();
  ignoredUsers = await loadIgnoredUsers();
  const isUserIgnored = checkIfUserIsIgnored(username);
  if (!isUserIgnored) {
    client.whisper(username, `purr`);
  } else {
    client.whisper(
      username,
      `Something went cat-astrophic! Message my owner: UpDownLeftDie`,
    );
  }
}

function checkIfUserIsIgnored(username) {
  return ignoredUsers.indexOf(username) > -1;
}
