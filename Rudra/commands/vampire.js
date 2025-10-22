const axios = require("axios");

module.exports.config = {
  name: "vampire",
  version: "6.1.0",
  hasPermssion: 0,
  credits: "Rudra",
  description: "🧛‍♂️ Ultimate Vampire Bot – Dual-mode, Bold, FULL HORNY, Romantic & Teasing",
  commandCategory: "ai",
  usages: "vampire [boy/girl] + 'bold on/off' + 'horny on/off'",
  cooldowns: 2
};

module.exports.handleEvent = async function({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!body) return;

  // Global session & chat memory
  global.vampireSessions = global.vampireSessions || {};
  global.vampire = global.vampire || {};
  global.vampire.chatHistory = global.vampire.chatHistory || {};
  const chatHistory = global.vampire.chatHistory;
  chatHistory[senderID] = chatHistory[senderID] || [];

  const msg = body.trim().toLowerCase();

  // ====== MODE TOGGLES ======
  global.vampireSessions[threadID] = global.vampireSessions[threadID] || {};
  const session = global.vampireSessions[threadID];

  // Bold Mode
  if(msg.startsWith("vampire bold on")) {
    session.boldMode = true;
    return api.sendMessage("[vampire] Bold mode activated 😈", threadID, messageID);
  }
  if(msg.startsWith("vampire bold off")) {
    session.boldMode = false;
    return api.sendMessage("[vampire] Bold mode off 😌", threadID, messageID);
  }

  // Horny Mode (FULL HORNY)
  if(msg.startsWith("vampire horny on")) {
    session.hornyMode = true;
    return api.sendMessage("[vampire] Horny mode FULL ON 😈🔥 ab main max naughty hoon!", threadID, messageID);
  }
  if(msg.startsWith("vampire horny off")) {
    session.hornyMode = false;
    return api.sendMessage("[vampire] Horny mode off 😌 ab normal flirty hoon", threadID, messageID);
  }

  // Activation triggers: boy / girl
  if(msg === "vampire boy" || msg === "vampire girl"){
    const mode = msg.includes("girl") ? "girl" : "boy";
    session.active = true;
    session.mode = mode;
    if(session.boldMode === undefined) session.boldMode = false;
    if(session.hornyMode === undefined) session.hornyMode = false;

    return api.sendMessage(
      mode === "girl"
        ? "[vampire] Hey jaan 💋 main tumhari Vampire Girl aagayi 😚 kya soch rahe ho?"
        : "[vampire] Bolo baby 😏 aapka Vampire Boy hazir hai ❤️",
      threadID,
      messageID
    );
  }

  // ====== CHECK ACTIVE SESSION ======
  if(!session.active) return;
  const mode = session.mode;
  const bold = session.boldMode;
  const horny = session.hornyMode;

  // ====== STORE CHAT HISTORY ======
  chatHistory[senderID].push(`User: ${body}`);
  if(chatHistory[senderID].length > 6) chatHistory[senderID].shift();
  const fullChat = chatHistory[senderID].join("\n");

  // ====== FLIRTY / HORNY AUTOMATIC RESPONSES ======
  let botReply = "";
  const specialWords = ["kiss","chummie","hug","pyar","love"];
  const lowerMsg = body.toLowerCase();

  if(specialWords.some(w => lowerMsg.includes(w))){
    if(horny){
      botReply = "Hmm 😏🔥 chummie ke saath thoda aur naughty touch ❤️‍🔥"; // full horny
    } else if(bold){
      botReply = "Hmm 😈 chummie toh banti hai ❤️"; // bold
    } else {
      botReply = "Aww 😌 ek pyari si chummie 💋"; // normal
    }
  }

  // ====== NORMAL AI RESPONSE (via Pollinations or API) ======
  if(!botReply){
    const prompt = `
Tum ek AI Vampire ${mode === "girl" ? "ladki" : "ladka"} ho, pro max romantic, naughty aur thoda teasing/bejti bhi karte ho 😈.
Bold mode agar on hai to thoda daring / flirty style me reply do.
Horny mode agar on hai to maximum naughty/flirty/teasing style me reply do.
Har reply 1-2 line me ho, max 50 words.
Prefix har message me '[vampire]'.
Jo pucha jaaye sirf utna hi bolna hai. Ladke-ladki dono ka mazaak thoda karo.
Koi puche kisne banaya → “Mujhe banaya hai *Rudra Boss* ne 😎”
Language: Hinglish.
Chat history:
${fullChat}
`;
    try {
      const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}`;
      const res = await axios.get(url);
      botReply = (typeof res.data === "string" ? res.data : JSON.stringify(res.data)).trim();
    } catch(err){
      console.error("Pollinations error:", err.message);
      botReply = horny
        ? "Oops 😈 Vampire abhi busy hai, par horny mode me hoon 🔥"
        : bold
        ? "Oops 😈 thodi der busy hoon, bold mode me hoon ❤️"
        : "Sorry 😌 abhi busy hoon, baad me baat karte hain 💌";
    }
  }

  // ====== RANDOM SIGNATURE ======
  const showSignature = Math.random() < 0.2;
  const signature = showSignature ? "\n\n~ Rudra Boss Creation 😎" : "";

  // ====== STORE BOT REPLY ======
  chatHistory[senderID].push(`vampire-${mode}: ${botReply}`);
  return api.sendMessage(`[vampire] ${botReply}${signature}`, threadID, messageID);
};

// ====== RUN COMMAND ======
module.exports.run = async function({ api, event }){
  return api.sendMessage(
    "[vampire] Choose your vibe 😈\n• vampire boy\n• vampire girl\n\nPhir mere message ka reply karo ❤️\n\nToggle Bold/Horny:\n• vampire bold on/off\n• vampire horny on/off",
    event.threadID,
    event.messageID
  );
};
