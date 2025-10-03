const axios = require("axios");
const fs = require("fs");

// User cache
const userNameCache = {};
let hornyMode = false;
let riyaEnabled = true;
let googleMode = false;

// === Owner UID ===
const ownerUID = "61550558518720";

// --- Voice Reply ---
async function getVoiceReply(text, langCode = "hi-in") {
  const apiKey = process.env.VOICERSS_API_KEY || "YOUR_API_KEY";
  if (!apiKey) return null;

  const url = `https://api.voicerss.org/?key=${apiKey}&hl=${langCode}&src=${encodeURIComponent(text)}`;
  try {
    const res = await axios.get(url, { responseType: "arraybuffer" });
    const path = `/tmp/voice_reply.mp3`; // safer path on Render
    fs.writeFileSync(path, res.data);
    return path;
  } catch (e) {
    console.error("TTS Error:", e.message);
    return null;
  }
}

// --- Get GIF ---
async function getGIF(query) {
  const giphyKey = "dc6zaTOxFJmzC";
  try {
    const res = await axios.get(`https://api.giphy.com/v1/gifs/search`, {
      params: { api_key: giphyKey, q: query, limit: 1 },
    });
    return res.data.data?.[0]?.images?.original?.url || null;
  } catch (e) {
    console.error("GIF Error:", e.message);
    return null;
  }
}

// --- Get Username ---
async function getUserName(api, uid) {
  if (userNameCache[uid]) return userNameCache[uid];
  try {
    const info = await api.getUserInfo(uid);
    const name = info[uid]?.name || (uid === ownerUID ? "Boss" : "yaar");
    userNameCache[uid] = name;
    return name;
  } catch {
    return uid === ownerUID ? "Boss" : "yaar";
  }
}

// --- Chat history ---
const chatHistories = {};

// --- Detect language ---
function detectLanguage(text) {
  const t = text.toLowerCase();
  if (["ke haal se","kaisa se","ram ram"].some(w=>t.includes(w))) return "hr";
  if (["ki haal aa","kivein ho"].some(w=>t.includes(w))) return "pa";
  return "hi-in";
}

// --- Toggle functions ---
async function toggleHornyMode(body){
  body = body.toLowerCase();
  if(body.includes("horny mode on")||body.includes("garam mode on")){ hornyMode=true; return "Horny mode ON 😈🔥"; }
  if(body.includes("horny mode off")||body.includes("garam mode off")){ hornyMode=false; return "Horny mode OFF 😉"; }
  return null;
}

async function toggleRiyaOnOff(body, senderID){
  if(senderID!==ownerUID) return null;
  body=body.toLowerCase();
  if(body.includes("riya on")){ if(riyaEnabled) return "Already ON Boss! 😉"; riyaEnabled=true; return "Riya ON 😎"; }
  if(body.includes("riya off")){ if(!riyaEnabled) return "Already OFF Boss 😴"; riyaEnabled=false; return "Riya OFF 👋"; }
  return null;
}

async function toggleGoogleMode(body,senderID){
  if(senderID!==ownerUID) return null;
  body=body.toLowerCase();
  if(body.includes("google on")||body.includes("riya google on")){ if(googleMode) return "Google mode already ON 🔍"; googleMode=true; return "Google mode ON 🤓"; }
  if(body.includes("google off")||body.includes("riya google off")){ if(!googleMode) return "Google mode already OFF 😴"; googleMode=false; return "Google mode OFF 😉"; }
  return null;
}

// --- Main handler ---
module.exports.handleEvent = async function({api,event}){
  try{
    const {threadID,messageID,senderID,body,messageReply} = event;
    if(!body) return;

    // Owner toggles
    const resOnOff = await toggleRiyaOnOff(body,senderID);
    if(resOnOff) return api.sendMessage(resOnOff,threadID,messageID);
    const resGoogle = await toggleGoogleMode(body,senderID);
    if(resGoogle) return api.sendMessage(resGoogle,threadID,messageID);

    // Riya off
    if(!riyaEnabled && senderID!==ownerUID) return;

    const isTrigger = body.toLowerCase().startsWith("riya") || (messageReply?.senderID===api.getCurrentUserID());
    if(!isTrigger) return;

    const userName = await getUserName(api,senderID);
    let userMsg = isTrigger?body.slice(4).trim():body.trim();
    if(!userMsg){ return api.sendMessage(senderID===ownerUID?`Hey Boss ${userName}! 😎`:`Hello ${userName} 😉`,threadID,messageID); }

    api.sendTypingIndicator(threadID,true);

    // Chat history
    if(!chatHistories[senderID]) chatHistories[senderID]=[];
    chatHistories[senderID].push(`User: ${userMsg}`);
    if(chatHistories[senderID].length>10) chatHistories[senderID].shift();

    // Prompt for AI
    let langCode = detectLanguage(userMsg);
    let prompt = googleMode?`Google Search_REQUEST: User asked: "${userMsg}"`:`Riya conversation with ${userName}: ${chatHistories[senderID].join("\n")}\nRiya:`;

    const resAI = await axios.post("https://rudra-here-brs2.onrender.com",{prompt});
    let reply = resAI.data?.text?.trim() || "Sorry, samajh nahi aaya.";

    chatHistories[senderID].push(`Riya: ${reply}`);

    // Voice optional
    const voiceFile = await getVoiceReply(reply,langCode);
    if(voiceFile){
      api.sendMessage({attachment: fs.createReadStream(voiceFile)},threadID,(err)=>{
        if(fs.existsSync(voiceFile)) fs.unlinkSync(voiceFile);
      });
    }

    // GIF optional
    if(!googleMode){
      const gifUrl = await getGIF(senderID===ownerUID?"charming fun":"cool witty");
      if(gifUrl) api.sendMessage({body: reply,attachment:await axios.get(gifUrl,{responseType:'stream'}).then(r=>r.data)},threadID,messageID);
      else api.sendMessage(reply,threadID,messageID);
    }else{
      api.sendMessage(reply,threadID,messageID);
    }

  }catch(e){
    console.error("Riya error:",e.message);
    api.sendMessage("System glitch 😅, try later.",event.threadID,event.messageID);
  }
};
