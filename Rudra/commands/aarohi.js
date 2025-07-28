const axios = require("axios");

module.exports = {
  config: {
    name: "aarohi",
    version: "2.0.1",
    author: "Rudra",
    countDown: 2,
    role: 0,
    shortDescription: "Aarohi - naughty AI girlfriend",
    longDescription: "Chat with Aarohi in Hinglish, flirty & funny replies",
    category: "ai",
    guide: {
      en: "Type 'aarohi' or 'aaru' or 'आरोही' to activate, then reply to her message to chat"
    }
  },

  onMessage: async function ({ message, event }) {
    const { threadID, senderID, body, messageReply } = event;

    global.aarohiSessions = global.aarohiSessions || {};

    // Trigger words for activation
    const triggerWords = ["aarohi", "aaru", "Aarohi", "Aaru", "आरोही"];
    const lowerBody = body.trim().toLowerCase();

    // STEP 1: Trigger activation
    if (triggerWords.includes(lowerBody)) {
      global.aarohiSessions[threadID] = true;
      return message.reply("Bolo jaanu 😘 kya haal hai?");
    }

    // STEP 2: Check if Aarohi is active and reply is to bot
    const isActive = global.aarohiSessions[threadID];
    const isReplyToAarohi = messageReply && messageReply.senderID === global.GoatBot.botID;
    if (!isActive || !isReplyToAarohi) return;

    // History tracking
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
      return message.reply("Sorry jaan! Aarohi abhi thoda busy hai... thodi der baad milte hain 😘");
    }
  }
};
