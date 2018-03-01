'use strict';
const _ = require('lodash');
if (_.get(process, 'env.NODE_ENV') !== 'production') {
  require('dotenv').load();
}
const tmi = require('tmi.js');
const FileSync = require('lowdb/adapters/FileSync');
const lowdb = require('lowdb');

const adapter = new FileSync('db.json');
const db = lowdb(adapter);

// load settings from env
const { BOT_USERNAME, BOT_OAUTH, SUCCESS_RATE, WORD_SUCCESS_RATE } = _.get(
  process,
  'env',
);
console.log(BOT_USERNAME);
if (!BOT_USERNAME) {
  // should be a twitch username
  console.error('MISSING USERNAME');
  return;
} else if (!BOT_OAUTH) {
  // should be an oauth for the account above
  console.error('MISSING PASSWORD');
  return;
} else if (!SUCCESS_RATE) {
  // should be a precent in decimal form
  console.error('MISSING SUCCESS_RATE');
  return;
} else if (!WORD_SUCCESS_RATE) {
  // should be a precent in decimal form
  console.error('MISSING WORD_SUCCESS_RATE');
  return;
}

// Dictionary of words to catified words
const WORDS = {
  'blaze it 420': 'CAT NIP 420',
  'dillon francis': 'Dillon Furncis',
  'law and order': 'Claw and Order',
  'mat zo': 'Meow Zo',
  'nature box': 'Litter Box',
  'new zealand': 'Mew Zealand',
  'porter robinson': 'Purrter Robinson',
  attitude: 'cattitude',
  australia: 'Pawstralia',
  awesome: 'clawsome',
  bye: 'ta ta for meow',
  cali: 'calico',
  california: 'Calicofornia',
  canada: 'Catnada',
  catastrophe: 'cat-astrophe',
  catastrophic: 'cat-astrophic',
  chowder: 'meowder',
  collateral: 'catllateral',
  feelings: 'felines',
  forget: 'furget',
  hello: 'konnichipaw',
  Kappa: 'Catta',
  kidding: 'kitten',
  luigi: 'Purrigi',
  lurking: 'waiting to pounce',
  lying: 'lion',
  madeon: 'Meowdeon',
  mario: 'Meowrio',
  mix: 'Meow Mix',
  music: 'mewsic',
  nap: 'catnap',
  new: 'mew',
  now: 'meow',
  pa: 'paw',
  papa: 'pawpaw',
  pasta: 'pawsta',
  pause: 'paws',
  perfect: 'purrfect',
  purchase: 'purrchase',
  sackjuice: 'SaucerMilk',
  taco: 'tacocat',
  tale: 'tail',
  twitter: 'Litter',
  weed: 'catnip',
  whiskey: 'whiskers',
};
// finds all words that match in the dictionarty, case-insensitive
const MATCHER = new RegExp(`\\b(?:${Object.keys(WORDS).join('|')})\\b`, 'gi');
// example: \b(?:now|perfect|pause)\b

// join self-channel by default
db.defaults({ channels: ['#myaubot'], ignoredUsers: [] }).write();
let ignoredUsers = [];
loadIgnoredUsers().then(results => {
  ignoredUsers = results;
  initalizeTmiClient();
});

function initalizeTmiClient() {
  const channels = db.get('channels').value();

  const tmiOptions = {
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

  const client = new tmi.client(tmiOptions);

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
        } else {
          meowify(client, message, channel, username);
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

async function meowify(client, message, channel, username) {
  if (SUCCESS_RATE - Math.random() < 0) {
    return;
  } else if (MATCHER.test(message)) {
    const newMessage = message.replace(MATCHER, function(match) {
      if (WORD_SUCCESS_RATE - Math.random() > 0) {
        return WORDS[match.toLowerCase()];
      } else {
        return match;
      }
    });

    if (newMessage !== message) {
      const isUserIgnored = checkIfUserIsIgnored(ignoredUsers, username);
      if (!isUserIgnored) {
        client.say(channel, newMessage);
      }
    }
  }
}

// joins a new channel and saves it to the database
function joinChannel(client, username) {
  db
    .get('channels')
    .push(`#${username}`)
    .write();

  return client.join(username);
}

// leaves channel and removes it to the database
function leaveChannel(client, username) {
  db
    .get('channels')
    .pull(`#${username}`)
    .write();

  return client.leave(username);
}

async function loadIgnoredUsers() {
  return db.get('ignoredUsers').value();
}

async function ignoreUser(client, username) {
  let isUserIgnored = checkIfUserIsIgnored(username);
  if (!isUserIgnored) {
    db
      .get('ignoredUsers')
      .push(username)
      .write();
    ignoredUsers = await loadIgnoredUsers();
    isUserIgnored = checkIfUserIsIgnored(username);
  }
  if (isUserIgnored) {
    client.whisper(username, `I won't paw at your messages any more :3`);
  } else {
    client.whisper(
      username,
      `Something went cat-astrophic! Message my owner: UpDownLeftDie`,
    );
  }
}

async function unignoreUser(client, username) {
  db
    .get('ignoredUsers')
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
