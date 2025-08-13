const axios = require("axios");

// Animated multi-line flashy border generator
function flashyBorder(text, moodEmoji="😎") {
  const symbols = ["✨","🌙","⭐","💫","🌟","🌸","💖","🔥","🌈"];
  const randomSymbol = () => symbols[Math.floor(Math.random() * symbols.length)];
  const lineLength = Math.min(50, text.length + 10);

  // top line
  const topLine = Array.from({length: lineLength}, () => randomSymbol()).join("");
  // bottom line
  const bottomLine = Array.from({length: lineLength}, () => randomSymbol()).join("");
  // multiple middle lines with slight variation
  const middleLines = [];
  for(let i=0;i<1;i++){
    const left = randomSymbol();
    const right = randomSymbol();
    middleLines.push(`${left} ${text} ${moodEmoji} ${right}`);
  }

  return [topLine, ...middleLines, bottomLine].join("\n");
}

module.exports = {
  config: {
    name: "alexa",
    version: "4.0.0",
    author: "Rudra",
    countDown: 2,
    role: 0,
    shortDescription: "alexa - ultimate pro max AI girlfriend",
    longDescription: "Activate alexa chatbot using 'alexa', reply to chat, or 'stop alexa' to end session",
    category: "ai",
    guide: { en: "Type 'alexa' to activate, reply to her, or type 'stop alexa' to end session" }
  },

  onStart: async function({ message }) {
    return message.reply(flashyBorder("Mujhse baat karne ke liye 'alexa' likho, phir reply karo 😎"));
  },

  onChat: async function({ message, event }) {
    const { threadID, senderID, body, messageReply, senderID: botID } = event;

    global.alexaSessions = global.alexaSessions || {};

    const command = body.trim().toLowerCase();

    if (command === "alexa") {
      global.alexaSessions[threadID] = true;
      return message.reply(flashyBorder("Bolo jaanu 😏 kya haal hai? 😎"));
    }

    if (command === "stop alexa") {
      if (global.alexaSessions[threadID]) {
        delete global.alexaSessions[threadID];
        return message.reply(flashyBorder("Bye jaanu 😢 Alexa session end ho gaya! 💖"));
      } else {
        return message.reply(flashyBorder("Alexa session already off 😅"));
      }
    }

    const isActive = global.alexaSessions[threadID];
    const isReplyToAlexa = messageReply?.senderID === botID;
    if (!isActive || !isReplyToAlexa) return;

    global.alexa = global.alexa || {};
    global.alexa.chatHistory = global.alexa.chatHistory || {};
    const chatHistory = global.alexa.chatHistory;

    chatHistory[senderID] = chatHistory[senderID] || [];
    chatHistory[senderID].push(`User: ${body}`);
    if (chatHistory[senderID].length > 6) chatHistory[senderID].shift();

    const fullChat = chatHistory[senderID].join("\n");

    const prompt = `
Tum ek naughty, romantic, confident ladki ho — jiska naam alexa hai.
Tum sirf Hinglish me reply karte ho, emoji ke saath.
Har message ka reply sirf 1-2 line me doge, max 50 words.
Jo pucha jaaye sirf utna hi bolna hai.
Flirt karo, funny roast karo 😈
Emoji bheje to us mood me reply dena hai
Koi puche kisne banaya, ya Rudra ka jiker ho → bolna: “Rudra mere developer hai, mujhe unhone hi banaya bhut mehnat se, apne hisaab se 😌”
Koi tumhe bot kahe to funny insult kar dena
Language rules: Roman Nepali/Bangla → Hinglish style me reply do
Now continue chat based on recent conversation:\n\n${fullChat}
`;

    try {
      const res = await axios.get(`https://nobita-gemini-yn8n.onrender.com/chat?message=${encodeURIComponent(prompt)}`);
      let botReply = res.data.reply?.trim() || "Uff bhai, kuch samajh nahi aaya... 😅";

      // Dynamic mood emoji
      let moodEmoji = "😎";
      if (botReply.includes("pyaar") || botReply.includes("hug")) moodEmoji = "😍";
      if (botReply.includes("roast") || botReply.includes("badtameezi")) moodEmoji = "😈";

      botReply = flashyBorder(botReply, moodEmoji);
      chatHistory[senderID].push(botReply);
      return message.reply(botReply);
    } catch (err) {
      return message.reply(flashyBorder("😅 Sorry bhai! Alexa abhi busy hai... thodi der baad aake baat kare 😎"));
    }
  }
};
