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

- `BASE_SUCCESS_RATE` The chance a message with a single match will be converted. It's `a` this function `y = ab^x`

- `WORD_GROWTH_SUCCESS_RATE` The growth factor for each additional word. It's `b` this function `y = ab^x`

- Example: When `BASE_SUCCESS_RATE = 0.1` and `WORD_GROWTH_SUCCESS_RATE = 2`: For a single word `y = (0.1)(2)^(1) = .2` there is a 20% chance of converting a message.
