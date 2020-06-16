if (process.env && process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// load settings from env
const {
  BOT_USERNAME,
  BOT_OAUTH,
  BASE_SUCCESS_RATE,
  WORD_GROWTH_SUCCESS_RATE,
} = process.env;

if (!BOT_USERNAME) {
  // should be a twitch username
  console.error("MISSING USERNAME");
  return;
} else if (!BOT_OAUTH) {
  // should be an oauth for the account above
  console.error("MISSING PASSWORD");
  return;
} else if (!BASE_SUCCESS_RATE) {
  // should be a precent in decimal form
  console.error("MISSING BASE_SUCCESS_RATE");
  return;
} else if (!WORD_GROWTH_SUCCESS_RATE) {
  // should be a precent in decimal form
  console.error("MISSING WORD_GROWTH_SUCCESS_RATE");
  return;
}

module.exports = {
  BOT_USERNAME,
  BOT_OAUTH,
  BASE_SUCCESS_RATE,
  WORD_GROWTH_SUCCESS_RATE,
};
