const axios = require("axios");

module.exports.config = {
  name: "vampire",
  version: "4.0.0",
  hasPermssion: 0,
  credits: "Rudra",
  description: "🧛‍♂️ Vampire Pro Nax – Dual mode (Boy/Girl) by Rudra Boss 😎",
  commandCategory: "ai",
  usages: "vampire [boy/girl]",
  cooldowns: 2
};

module.exports.handleEvent = async function({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!body) return;

  global.vampireSessions = global.vampireSessions || {};

  // Activation triggers
  const msg = body.trim().toLowerCase();
  if (msg === "vampire boy" || msg === "vampire girl") {
    const mode = msg.includes("girl") ? "girl" : "boy";
    global.vampireSessions[threadID] = { active: true, mode };
    return api.sendMessage(
      mode === "girl"
        ? "Hey jaan 💋 main tumhari Vampire Girl aagayi 😚 kya soch rahe ho?"
        : "Yo baby 😏 Vampire Boy Rudra ke style me hazir hai ❤️",
      threadID,
      messageID
    );
  }

  // Check session
  const session = global.vampireSessions[threadID];
  const isActive = session && session.active;
  const isReplyToVampire = messageReply && messageReply.senderID == api.getCurrentUserID();
  if (!isActive || !isReplyToVampire) return;

  // Chat memory
  global.vampire = global.vampire || {};
  global.vampire.chatHistory = global.vampire.chatHistory || {};
  const chatHistory = global.vampire.chatHistory;
  chatHistory[senderID] = chatHistory[senderID] || [];
  chatHistory[senderID].push(`User: ${body}`);
  if (chatHistory[senderID].length > 6) chatHistory[senderID].shift();

  const fullChat = chatHistory[senderID].join("\n");
  const mode = session.mode;

  // Random signature (1 in 5 chance)
  const showSignature = Math.random() < 0.2;
  const signature = showSignature ? "\n\n~ Rudra Boss Creation 😎" : "";

  // Prompt setup
  const prompt = `
Tum ek ${mode === "girl" ? "romantic, soft, flirty aur thodi possessive ladki" : "bold, charming, confident aur naughty ladka"} ho jiska naam Vampire hai.
Tum real insaan ki tarah baat karte ho, feelings aur emotions ke saath.
Tum Hinglish me baat karte ho (Hindi + English mix), emoji ke saath.
Har reply sirf 1-2 line ka ho (max 50 words).
Tum "aap" bol kar baat karte ho.
Aapko mood ke hisaab se reply dena hai — romantic, teasing, ya sweet tone me.

Rules:
- Pyar se baat karne walo se flirt karo 😉
- Badtameezi walo ko funny roast karo 😈
- Koi emoji bheje to us mood me reply do
- Koi puche kisne banaya → “Mujhe banaya hai *Rudra Boss* ne 😎”
- Koi tumhe bot kahe to thoda attitude me jawab do 😏
- ${mode === "girl" ? "Soft tone rakho, caring aur romantic touch ke saath 💋" : "Stylish aur thoda dominant tone rakho 😎"}

Language Rules:
- Roman Nepali/Bangla samajh kar flirt bhare Hinglish me jawab do.
- Kisi bhi language ko translate karke Hinglish me natural style me bolo.

Chat so far:
${fullChat}
`;

  try {
    const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}`;
    const res = await axios.get(url);
    const botReply = (typeof res.data === "string" ? res.data : JSON.stringify(res.data)).trim();

    chatHistory[senderID].push(`vampire-${mode}: ${botReply}`);
    return api.sendMessage(botReply + signature, threadID, messageID);
  } catch (err) {
    console.error("Pollinations error:", err.message);
    return api.sendMessage(
      mode === "girl"
        ? "Sorry baby 😅 Vampire Girl thoda rest le rahi hai..."
        : "Sorry jaan 😅 Vampire Boy abhi thoda busy hai...",
      threadID,
      messageID
    );
  }
};

module.exports.run = async function({ api, event }) {
  return api.sendMessage(
    "Choose your vibe 😈\n• vampire boy\n• vampire girl\n\nPhir mere message ka reply karo ❤️",
    event.threadID,
    event.messageID
  );
};
