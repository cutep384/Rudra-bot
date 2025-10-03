const fs = require("fs-extra");
const path = require("path");
const ytdlp = require("yt-dlp-exec");
const ffmpeg = require("ffmpeg-static");

function deleteAfterTimeout(filePath, timeout = 60000) {
  setTimeout(() => {
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (!err) console.log(`🧹 Deleted file: ${filePath}`);
      });
    }
  }, timeout);
}

function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

module.exports = {
  config: {
    name: "music",
    version: "2.0.0",
    hasPermission: 0,
    credits: "🛡️ Rudra Jaat",
    description: "Play music or video by name (no link needed)",
    commandCategory: "Media",
    usages: "music <query> | music video <query>",
    cooldowns: 5,
  },

  run: async function ({ api, event, args }) {
    if (!args[0]) return api.sendMessage("🎵 Gana ka naam to likho! 😐", event.threadID);

    const isVideo = args[0].toLowerCase() === "video";
    const query = isVideo ? args.slice(1).join(" ") : args.join(" ");
    const tempPath = path.join(__dirname, "cache");
    await fs.ensureDir(tempPath);

    try {
      const info = await ytdlp(`ytsearch:"${query} audio"`, {
        dumpSingleJson: true,
        noWarnings: true,
        preferFreeFormats: true,
        noCheckCertificate: true,
        forceIpv4: true
      });

      if (!info || !info.title || info.entries?.[0] === null) {
        return api.sendMessage("❌ Video restricted ya unavailable hai.", event.threadID);
      }

      const videoUrl = info.url;
      const title = info.title;
      const safeTitle = title.replace(/[^\w\s]/gi, "_").slice(0, 30);
      const format = isVideo ? "mp4" : "mp3";
      const filePath = path.join(tempPath, `${safeTitle}.${format}`);
      const thumbUrl = info.thumbnail;
      const thumbExt = thumbUrl.endsWith(".png") ? "png" : "jpg";
      const thumbPath = path.join(tempPath, `${safeTitle}.${thumbExt}`);

      // Download thumbnail
      const thumbRes = await ytdlp(thumbUrl, {
        output: thumbPath,
        noWarnings: true
      });

      // Send metadata + thumbnail
      await api.sendMessage({
        body:
          `🎵 ${isVideo ? "🎥 Video" : "🎧 Audio"} Info:\n\n` +
          `📌 Title: ${title}\n` +
          `📺 Channel: ${info.uploader}\n` +
          `👁️ Views: ${formatNumber(info.view_count)}\n` +
          `⏱️ Duration: ${formatDuration(info.duration)}\n\n` +
          `🔗 ${videoUrl}`,
        attachment: fs.createReadStream(thumbPath),
      }, event.threadID, () => deleteAfterTimeout(thumbPath), event.messageID);

      // Download media
      await ytdlp(videoUrl, {
        output: filePath,
        extractAudio: !isVideo,
        audioFormat: "mp3",
        audioQuality: 0,
        ffmpegLocation: ffmpeg,
        noCheckCertificate: true,
        forceIpv4: true
      });

      api.setMessageReaction("✅", event.messageID, () => {}, true);

      await api.sendMessage({
        attachment: fs.createReadStream(filePath),
      }, event.threadID, event.messageID);

      deleteAfterTimeout(filePath, 60000);

    } catch (err) {
      console.error("❌ Music command error:", err);
      api.sendMessage(`❌ Error: ${err.message}`, event.threadID, event.messageID);
    }
  },
};
