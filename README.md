# myaubot-twitch

## _A bot that Cat-ifies your chat_

Created by Jared from [UpDownLeftDie](https://www.twitch.tv/updownleftdie)

### Commands

- `!meowify`: Send in a whisper or any chat myaubot is already in to have it join the your channel
- `!unmeowify`: Send in a whisper or any chat myaubot is already in to have it leave the your channel
- `!hiss`: Will ignore you and not meowify your messages in any channel
- `!patpat`: Will stop ignoring you and meowify your messages once again

### Setup

MyauBot needs several environment variables

- `BOT_USERNAME` the twitch username of the bot account

  - Example: `myaubot`

- `BOT_OAUTH` the oauth password for the twitch bot account

  - Example: `oauth:12345asdf`

- `SUCCESS_RATE` the rate at which entire messages will succeed

  - Example: `0.55`

- `WORD_SUCCESS_RATE` the rate at which individual words in a message will succeed

  - Example: `0.8`
