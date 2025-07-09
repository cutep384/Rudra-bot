// Rudra Loader
const moment = require("moment-timezone");
const { readdirSync, readFileSync, writeFileSync, existsSync, unlinkSync } = require("fs-extra");
const { join, resolve } = require("path");
const { execSync } = require('child_process');
const logger = require("./utils/log.js");
const login = require("fca-smart-shankar");
const axios = require("axios");
const { Sequelize, sequelize } = require("./includes/database");
const listPackage = JSON.parse(readFileSync('./package.json')).dependencies;
const listbuiltinModules = require("module").builtinModules;

global.client = {
  commands: new Map(),
  events: new Map(),
  cooldowns: new Map(),
  eventRegistered: [],
  handleSchedule: [],
  handleReaction: [],
  handleReply: [],
  mainPath: process.cwd(),
  configPath: "",
  getTime: function (option) {
    return moment.tz("Asia/Kolkata").format({
      seconds: "ss",
      minutes: "mm",
      hours: "HH",
      date: "DD",
      month: "MM",
      year: "YYYY",
      fullHour: "HH:mm:ss",
      fullYear: "DD/MM/YYYY",
      fullTime: "HH:mm:ss DD/MM/YYYY"
    }[option] || "");
  }
};

global.data = {
  threadInfo: new Map(),
  threadData: new Map(),
  userName: new Map(),
  userBanned: new Map(),
  threadBanned: new Map(),
  commandBanned: new Map(),
  threadAllowNSFW: [],
  allUserID: [],
  allCurrenciesID: [],
  allThreadID: []
};

global.utils = require("./utils");
global.nodemodule = {};
global.config = {};
global.configModule = {};
global.moduleData = [];
global.language = {};

// Load config.json
try {
  global.client.configPath = join(global.client.mainPath, "config.json");
  const configValue = require(global.client.configPath);
  Object.assign(global.config, configValue);
  logger.loader("Found and loaded config.json");
} catch (e) {
  return logger.loader("❌ config.json not found!", "error");
}

writeFileSync(global.client.configPath + ".temp", JSON.stringify(global.config, null, 4), 'utf8');

// Load language
const langFile = readFileSync(`${__dirname}/languages/${global.config.language || "en"}.lang`, "utf8").split(/\r?\n|\r/);
for (const line of langFile.filter(l => l.trim() && !l.startsWith("#"))) {
  const [key, ...valueParts] = line.split("=");
  const value = valueParts.join("=");
  const [head, subkey] = key.split(".");
  global.language[head] = global.language[head] || {};
  global.language[head][subkey] = value;
}
global.getText = function (...args) {
  let text = global.language?.[args[0]]?.[args[1]] || "";
  for (let i = 2; i < args.length; i++) text = text.replace(new RegExp(`%${i - 1}`, "g"), args[i]);
  return text;
};

// Load appstate
let appState;
try {
  appState = require(resolve(global.client.mainPath, global.config.APPSTATEPATH || "appstate.json"));
  logger.loader(global.getText("priyansh", "foundPathAppstate"));
} catch {
  return logger.loader(global.getText("priyansh", "notFoundPathAppstate"), "error");
}

// On Bot start
function onBot({ models }) {
  login({ appState }, async (err, api) => {
    if (err) return logger(JSON.stringify(err), "ERROR");

    api.setOptions(global.config.FCAOption);
    writeFileSync(global.client.configPath, JSON.stringify(global.config, null, 4));
    writeFileSync(global.config.APPSTATEPATH || "appstate.json", JSON.stringify(api.getAppState(), null, 2));

    global.client.api = api;
    global.client.timeStart = Date.now();

    // Load commands directly
    const cmdDir = join(global.client.mainPath, 'Rudra', 'commands');
    for (const file of readdirSync(cmdDir).filter(f => f.endsWith(".js"))) {
      try {
        const command = require(join(cmdDir, file));
        global.client.commands.set(command.config.name, command);
        logger.loader(`✅ Loaded Command: ${command.config.name}`);
      } catch (e) {
        logger.loader(`❌ Error loading command ${file}: ${e.message}`, "error");
      }
    }

    // Load events directly
    const evtDir = join(global.client.mainPath, 'Rudra', 'events');
    for (const file of readdirSync(evtDir).filter(f => f.endsWith(".js"))) {
      try {
        const event = require(join(evtDir, file));
        global.client.events.set(event.config.name, event);
        logger.loader(`✅ Loaded Event: ${event.config.name}`);
      } catch (e) {
        logger.loader(`❌ Error loading event ${file}: ${e.message}`, "error");
      }
    }

    logger.loader(`🚀 All Modules Loaded | Commands: ${global.client.commands.size} | Events: ${global.client.events.size}`);
    logger.loader(`⏱️ Startup Time: ${((Date.now() - global.client.timeStart) / 1000).toFixed(2)}s`);

    const listener = require('./includes/listen')({ api, models });
    global.handleListen = api.listenMqtt((err, msg) => {
      if (err) return logger(global.getText('priyansh', 'handleListenError', JSON.stringify(err)), "error");
      if (["presence", "typ", "read_receipt"].includes(msg.type)) return;
      if (global.config.DeveloperMode) console.log(msg);
      return listener(msg);
    });
  });
}

// Connect DB
(async () => {
  try {
    await sequelize.authenticate();
    const models = require('./includes/database/model')({ Sequelize, sequelize });
    logger(global.getText('priyansh', 'successConnectDatabase'), "[ DATABASE ]");
    onBot({ models });
  } catch (e) {
    logger(global.getText('priyansh', 'successConnectDatabase', JSON.stringify(e)), "[ DATABASE ]");
  }
})();

process.on('unhandledRejection', () => {});
