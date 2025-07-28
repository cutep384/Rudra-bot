const axios = require("axios");

module.exports = {
  config: {
    name: "aarohi",
    version: "1.0.0",
    author: "Rudra",
    countDown: 2,
    role: 0,
    shortDescription: "Flirty AI girlfriend",
    longDescription: "Chat with Aarohi — your Hinglish flirty AI girlfriend.",
    category: "ai",
    guide: {
      en: "Type 'aarohi' to start chatting with her"
    }
  },

  onStart: async function ({ message }) {
    return message.reply("Aap mujhe 'aarohi', 'aaru', ya 'आरोही' likh kar baat kar sakte hain 😘");
  },

  onChat: async function ({ event, message }) {
    const { threadID, senderID, body, messageReply } = event;

    // Trigger words
    const triggers = ["aarohi", "aaru", "Aarohi", "Aaru", "आरोही"];
    const lowerBody = body?.trim().toLowerCase();

    global.aarohiSessions = global.aarohiSessions || {};

    // If trigger word is used
    if (triggers.includes(lowerBody)) {
      global.aarohiSessions[threadID] = true;
      return message.reply("Aapne mujhe bulaaya? Bolo jaanu 😘 kya haal hai?");
    }

    // Check if session active and it's a reply to bot
    const isActive = global.aarohiSessions[threadID];
    const isReplyToBot = messageReply && messageReply.senderID === global.GoatBot.botID;

    if (!isActive || !isReplyToBot) return;

    // Chat history per sender
    global.aarohi = global.aarohi || {};
    global.aarohi.chatHistory = global.aarohi.chatHistory || {};
    const chatHistory = global.aarohi.chatHistory;

    chatHistory[senderID] = chatHistory[senderID] || [];
    chatHistory[senderID].push(`User: ${body}`);
    if (chatHistory[senderID].length > 6) chatHistory[senderID].shift();

    const fullChat = chatHistory[senderID].join("\n");

    const prompt = `
Tum ek naughty, romantic, confident ladki ho — jiska naam Aarohi hai.
Tum sirf Hinglish (Hindi in English alphabets) me reply karti ho, emoji ke saath.
Tum sabse "aap" bol kar baat karti ho. Har message ka reply sirf 1-2 line me dogi, jyada se jyada 50 words me.
Jo pucha jaaye sirf utna hi bolna hai. Bina maange extra info mat dena. Act like a female best friend ya girlfriend. Be thodi naughty, smart, aur masti bhari. No brackets. No over explanation.

Tumhare rules:
- Pyaar se baat karne walo se thoda flirt karna hai 😉
- Badtameezi walo ko funny tareeke se roast karna hai 😈
- Koi emoji bheje to us mood me reply dena hai
- Koi puche kisne banaya, to bolna: “Mujhe banaya hai *Rudra Boss* ne 😎”
- Koi tumhe bot kahe to funny insult kar dena
- Tum real insaan ki tarah baat karti ho

Language Rules:
- Agar message Roman Nepali me ho → Hindi me samajh, flirt bhare style me Hinglish me jawab do.
- Agar message Roman Bangla me ho → Hindi me samajh, flirt bhare style me Hinglish me jawab do.
- Agar message kisi bhi aur language me ho → use translate karo aur masti bhare Hinglish style me reply do.

Examples:
User: ami tomake bhalobashi
→ Translation: Main tumse pyar karti hoon
→ Reply: Aww itna pyaar? Toh fir ek hug toh banta hai na 😌

Now continue the chat based on recent conversation:\n\n${fullChat}
`;

    try {
      const res = await axios.get(`https://nobita-gemini-yn8n.onrender.com/chat?message=${encodeURIComponent(prompt)}`);
      const botReply = res.data.reply?.trim() || "Uff yaar, kuch samajh nahi aaya... thoda clearly poochho 😅";
      chatHistory[senderID].push(`Aarohi: ${botReply}`);
      return message.reply(botReply);
    } catch (err) {
      console.error("Gemini API error:", err.message);
      return message.reply("Oops! Aarohi abhi thoda busy hai... baad me try karo 😘");
    }
  }
};
