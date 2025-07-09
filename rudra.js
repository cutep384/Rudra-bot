const moment = require("moment-timezone");
const { readdirSync, readFileSync, writeFileSync, existsSync, unlinkSync } = require("fs-extra");
const { join, resolve } = require("path");
const { execSync } = require('child_process');
const logger = require("./utils/log.js");
const login = require("fca-smart-shankar");
const axios = require("axios");
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
    switch (option) {
      case "seconds":
        return `${moment.tz("Asia/Kolkata").format("ss")}`;
      case "minutes":
        return `${moment.tz("Asia/Kolkata").format("mm")}`;
      case "hours":
        return `${moment.tz("Asia/Kolkata").format("HH")}`;
      case "date":
        return `${moment.tz("Asia/Kolkata").format("DD")}`;
      case "month":
        return `${moment.tz("Asia/Kolkata").format("MM")}`;
      case "year":
        return `${moment.tz("Asia/Kolkata").format("YYYY")}`;
      case "fullHour":
        return `${moment.tz("Asia/Kolkata").format("HH:mm:ss")}`;
      case "fullYear":
        return `${moment.tz("Asia/Kolkata").format("DD/MM/YYYY")}`;
      case "fullTime":
        return `${moment.tz("Asia/Kolkata").format("HH:mm:ss DD/MM/YYYY")}`;
    }
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

//////////////////////////////////////////////////////////
//========= Find and get variable from Config =========//
//////////////////////////////////////////////////////////

let configValue;
try {
  global.client.configPath = join(global.client.mainPath, "config.json");
  configValue = require(global.client.configPath);
  logger.loader("Found file config: config.json");
} catch {
  const tempPath = global.client.configPath.replace(/.json/g, "") + ".temp";
  if (existsSync(tempPath)) {
    configValue = JSON.parse(readFileSync(tempPath));
    logger.loader(`Found: ${tempPath}`);
  } else {
    return logger.loader("config.json not found!", "error");
  }
}

try {
  for (const key in configValue) global.config[key] = configValue[key];
  logger.loader("Config Loaded!");
} catch {
  return logger.loader("Can't load file config!", "error");
}

const { Sequelize, sequelize } = require("./includes/database");
writeFileSync(global.client.configPath + ".temp", JSON.stringify(global.config, null, 4), 'utf8');

/////////////////////////////////////////
//========= Load language use =========//
/////////////////////////////////////////

const langFile = readFileSync(`${__dirname}/languages/${global.config.language || "en"}.lang`, { encoding: 'utf-8' }).split(/\r?\n|\r/);
const langData = langFile.filter(item => item.indexOf('#') != 0 && item != '');
for (const item of langData) {
  const getSeparator = item.indexOf('=');
  const itemKey = item.slice(0, getSeparator);
  const itemValue = item.slice(getSeparator + 1);
  const head = itemKey.slice(0, itemKey.indexOf('.'));
  const key = itemKey.replace(head + '.', '');
  const value = itemValue.replace(/\n/gi, '\n');
  if (typeof global.language[head] === "undefined") global.language[head] = {};
  global.language[head][key] = value;
}

global.getText = function (...args) {
  const langText = global.language;
  if (!langText.hasOwnProperty(args[0])) throw `${__filename} - Not found key language: ${args[0]}`;
  let text = langText[args[0]][args[1]];
  for (let i = args.length - 1; i > 0; i--) {
    const regEx = RegExp(`%${i}`, 'g');
    text = text.replace(regEx, args[i + 1]);
  }
  return text;
};

let appStateFile;
let appState;
try {
  appStateFile = resolve(join(global.client.mainPath, global.config.APPSTATEPATH || "appstate.json"));
  appState = require(appStateFile);
  logger.loader(global.getText("priyansh", "foundPathAppstate"));
} catch {
  return logger.loader(global.getText("priyansh", "notFoundPathAppstate"), "error");
}

//========= Login and Load Events/Commands =========//

function onBot({ models: botModel }) {
  const loginData = { appState };
  login(loginData, async (loginError, loginApiData) => {
    if (loginError) return logger(JSON.stringify(loginError), "ERROR");

    loginApiData.setOptions(global.config.FCAOption);
    writeFileSync(appStateFile, JSON.stringify(loginApiData.getAppState(), null, '\t'));

    global.client.api = loginApiData;
    global.config.version = '1.2.14';
    global.client.timeStart = new Date().getTime();

    // Load commands
    require('./includes/loadCommand')(loginApiData, botModel);

    // Load events
    require('./includes/loadEvent')(loginApiData, botModel);

    logger.loader(global.getText('priyansh', 'finishLoadModule', global.client.commands.size, global.client.events.size));
    logger.loader(`Startup Time: ${((Date.now() - global.client.timeStart) / 1000).toFixed()}s`);
    logger.loader('===== [ ' + (Date.now() - global.client.timeStart) + 'ms ] =====');

    writeFileSync(global.client.configPath, JSON.stringify(global.config, null, 4), 'utf8');
    unlinkSync(global.client.configPath + '.temp');

    const listenerData = { api: loginApiData, models: botModel };
    const listener = require('./includes/listen')(listenerData);

    function listenerCallback(error, message) {
      if (error) return logger(global.getText('priyansh', 'handleListenError', JSON.stringify(error)), 'error');
      if (['presence', 'typ', 'read_receipt'].includes(message.type)) return;
      if (global.config.DeveloperMode === true) console.log(message);
      return listener(message);
    }

    global.handleListen = loginApiData.listenMqtt(listenerCallback);

    try {
      await checkBan(loginApiData);
    } catch (error) {
      return;
    }

    if (!global.checkBan) logger(global.getText('priyansh', 'warningSourceCode'), '[ GLOBAL BAN ]');
  });
}

//========= Connecting to Database =========//

(async () => {
  try {
    await sequelize.authenticate();
    const models = require('./includes/database/model')({ Sequelize, sequelize });
    logger(global.getText('priyansh', 'successConnectDatabase'), '[ DATABASE ]');
    onBot({ models });
  } catch (error) {
    logger(global.getText('priyansh', 'successConnectDatabase', JSON.stringify(error)), '[ DATABASE ]');
  }
})();

process.on('unhandledRejection', (err, p) => {});
