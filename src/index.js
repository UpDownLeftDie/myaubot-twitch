'use strict';
const tmi = require('tmi.js');
const FileSync = require('lowdb/adapters/FileSync');
const lowdb = require('lowdb');
const config = require('./config');

const adapter = new FileSync(`${__dirname}/../db.json`);
const db = lowdb(adapter);

// Dictionary of words to catified words
const WORDS = require('../words.json');
// finds all words that match in the dictionary, case-insensitive
const MATCHER = new RegExp(`\\b(?:${Object.keys(WORDS).join('|')})\\b`, 'gi');
// example: \b(?:now|perfect|pause)\b

// join self-channel by default
db.defaults({ channels: ['#myaubot'], ignoredUsers: [], counts: {} }).write();
let ignoredUsers = [];
loadIgnoredUsers().then((results) => {
  ignoredUsers = results;
  console.log('Ignoring users: ', ignoredUsers);
  initializeTwitchClient();
});

function initializeTwitchClient() {
  const channels = db.get('channels').value();

  const twitchClientOptions = {
    options: {
      debug: false,
    },
    connection: {
      reconnect: true,
      secure: true,
    },
    identity: {
      username: config.BOT_USERNAME,
      password: config.BOT_OAUTH,
    },
    channels: channels,
  };

  const client = new tmi.Client(twitchClientOptions);
  client.connect();
  console.log('Joining channels: ', channels);

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
}

async function meowify(client, message, channel) {
  const matchCount = ((message || '').match(MATCHER) || []).length;
  // const matcherTestResults = MATCHER.test(message);
  if (matchCount > 0) {
    const newMessage = message.replace(MATCHER, function (match) {
      return WORDS[match.toLowerCase()];
    });

    const a = config.BASE_SUCCESS_RATE / config.WORD_GROWTH_SUCCESS_RATE;
    const b = config.WORD_GROWTH_SUCCESS_RATE;
    const x = matchCount;
    const successRate = a * Math.pow(b, x);
    if (newMessage !== message && successRate - Math.random() > 0) {
      console.log(`${channel}: ${newMessage}`);
      client.say(channel, newMessage);
      db.update('counts', (channels) => {
        channels[channel] = channels[channel] + 1 || 1;
        return channels;
      }).write();
    }
  }
}

// joins a new channel and saves it to the database
async function joinChannel(client, username) {
  db.get('channels').push(`#${username}`).write();

  return client
    .join(username)
    .then(() => {
      client.whisper(
        username,
        `I will now meowify messages in ${username}'s chat`,
      );
    })
    .catch((err) => {
      client.whisper(
        username,
        `Something went cat-astrophic! Message my owner: UpDownLeftDie`,
      );
      console.error(`Error joining channel: ${username}`, err);
    });
}

// leaves channel and removes it to the database
async function leaveChannel(client, username) {
  db.get('channels').pull(`#${username}`).write();

  return client
    .leave(username)
    .then(() => {
      client.whisper(
        username,
        `I will no longer meowify messages in ${username}'s chat'`,
      );
    })
    .catch((err) => {
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
    db.get('ignoredUsers').push(username).write();
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
  db.get('ignoredUsers').pull(username).write();
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
