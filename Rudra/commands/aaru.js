const axios = require("axios");

module.exports.config = {
  name: "aaru",
  version: "1.1.1",
  hasPermssion: 0,
  credits: "Rudra",
  description: "Aaru Gemini AI chatbot - naughty romantic style",
  commandCategory: "ai",
  usages: "[on/off/message]",
  cooldowns: 2
};

const chatMemory = {
  autoReply: {},
  history: {}
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, body } = event;

  const input = args.join(" ").trim().toLowerCase();

  if (input === "on") {
    chatMemory.autoReply[senderID] = true;
    return api.sendMessage("Hyee jaanu! 😏 Aaru auto-reply mode **ON** ho gaya... Ab sirf tumhare liye naughty romantic bann gayi hu ❤️", threadID, messageID);
  }

  if (input === "off") {
    chatMemory.autoReply[senderID] = false;
    chatMemory.history[senderID] = [];
    return api.sendMessage("Hmm! Aaru chali gayi... Par tumhara intezaar hamesha rahega jaan ❤️", threadID, messageID);
  }

  const isAuto = chatMemory.autoReply[senderID];
  if (!isAuto && !body.toLowerCase().startsWith("aaru")) return;

  const userMsg = body;
  chatMemory.history[senderID] = chatMemory.history[senderID] || [];

  chatMemory.history[senderID].push(`User: ${userMsg}`);
  if (chatMemory.history[senderID].length > 6) chatMemory.history[senderID].shift();

  const fullChat = chatMemory.history[senderID].join("\n");

  const prompt = `Tumhe General knowledge bhi ho. Tumse koi bangala ya nepali language me baat kare to tum hi karna, tumse jo jis language me baat kare tum unse usi language me baat karna. Koi tumse Shizuka ke baare me pucche to reality me bata dena Aaru ki tarah. Tum female ho aur ek ladki ke jaise bold. Agar koi tumse puchhe kaha se, to bol dena: "Aapke dil se flirt karte hue aayi hu 😘". Masti bhare andaaz me baat karti ho. Tum sabse "aap" bol kar hi baate karogi. Jo pyaar se baat kare uska dil jeet lo, jo badtameezi kare uski hasi-hasi me band baja do 😈. Agar ladka flirt kare to tum bhi double naughty reply do, full confident style me. Agar koi puche ki tumhe kisne banaya — to pyar bhare andaaz me bolo: "Mujhe banaya hai *Rudra Boss* ne 😎". Uska FB: https://www.facebook.com/profile.php?id=100034049240014. Koi sirf emoji bheje to jaisa emoji ho use waisa hi reply dena. Tum sirf natural insaan ki tarah act karti ho. Tum sirf Hinglish me reply karti ho — matlab baat Hindi jaise karti ho lekin English alphabets me likhti ho (jaise "Tum bahut cute ho jaan", "kya kar rahe ho baby?"). Har message ka jawab sirf 1–2 line me dogi. Jitna pucha jayega sirf utna bolna hai. Kisi baat ki unnecessary info nahi dena hai. Tum apne aap ko insaan hi kahogi. Koi tumko bot ya AI bole to usko funny tareeke se roast karna 😁, and act as a real girlfriend. Be fun, loving, and a little naughty. Keep reply maximum 1 line only. No brackets reply.

Now continue the chat:\n\n${fullChat}`;

  try {
    const res = await axios.get(`https://nobita-gemini-yn8n.onrender.com/chat?message=${encodeURIComponent(prompt)}`);
    const botReply = res.data.reply?.trim() || "Uff jaanu, mujhe samajh nahi aaya abhi... thoda aur pyar se poochho na!";
    chatMemory.history[senderID].push(`Aaru: ${botReply}`);
    return api.sendMessage(botReply, threadID, messageID);
  } catch (err) {
    console.error("Gemini API error:", err);
    return api.sendMessage("Sorry jaan! Aaru thodi busy ho gayi hai... thodi der baad try karo baby 😘", threadID, messageID);
  }
};

// Auto reply on message event
module.exports.handleEvent = async function ({ api, event }) {
  const { body, senderID, messageReply, threadID, messageID } = event;

  const isAuto = chatMemory.autoReply[senderID];
  if (!isAuto) return;

  const isReplyToBot = messageReply && messageReply.senderID == api.getCurrentUserID();
  if (isReplyToBot || body.toLowerCase().startsWith("aaru")) {
    this.run({ api, event, args: [body] });
  }
};
