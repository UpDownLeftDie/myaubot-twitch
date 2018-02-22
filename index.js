'use strict';
const _ = require('lodash');
if (_.get(process, 'env.NODE_ENV') !== 'production') {
  require('dotenv').load();
}
const { BOT_USERNAME, BOT_PASSWORD } = _.get(process, 'env');
console.log(BOT_USERNAME);
if (!BOT_USERNAME) {
  console.error('MISSING USERNAME');
  return;
} else if (!BOT_PASSWORD) {
  console.error('MISSING PASSWORD');
  return;
}

const tmi = require('tmi.js');
const FileSync = require('lowdb/adapters/FileSync');
const lowdb = require('lowdb');

const adapter = new FileSync('db.json');
const db = lowdb(adapter);

db.defaults({ channels: ['#myaubot'] }).write();

initalizeTmiClient();

function initalizeTmiClient() {
  const channels = db.get('channels').value();

  const tmiOptions = {
    options: {
      debug: true,
    },
    connection: {
      reconnect: true,
    },
    identity: {
      username: BOT_USERNAME,
      password: BOT_PASSWORD,
    },
    channels: channels,
  };

  const client = new tmi.client(tmiOptions);

  // Check messages that are posted in twitch chat
  client.on('message', (channel, userstate, message, self) => {
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
        if (message.toLowerCase().indexOf('!myauify') === 0) {
          joinChannel(client, userstate.username);
        } else if (message.toLowerCase().indexOf('!unmyauify') === 0) {
          leaveChannel(client, userstate.username);
        } else {
          myauify(client, message, channel);
        }
        break;
      case 'whisper':
        if (message.toLowerCase().indexOf('!myauify') === 0) {
          joinChannel(client, userstate.username);
        } else if (message.toLowerCase().indexOf('!unmyauify') === 0) {
          leaveChannel(client, userstate.username);
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

function myauify(client, message, channel) {
  const words = { now: 'meow', perfect: 'purrfect' };
  const matcher = new RegExp(`\\b(?:${Object.keys(words).join('|')})\\b`, 'gi');

  if (matcher.test(message)) {
    const newMessage = message.replace(matcher, function(match) {
      return words[match];
    });

    if (newMessage !== message) {
      client.say(channel, newMessage);
    }
  }
}

function joinChannel(client, username) {
  db
    .get('channels')
    .push(`#${username}`)
    .write();

  return client.join(username);
}

function leaveChannel(client, username) {
  db
    .get('channels')
    .pull(`#${username}`)
    .write();

  return client.leave(username);
}
