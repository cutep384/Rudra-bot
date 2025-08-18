const allowedUIDs = ["100085303477541", "61550558518720"]; // sirf ye UID wale changes kar sakte hain

module.exports.config = {
    name: "lock",
    version: "2.0",
    hasPermssion: 2, // sirf admin command chala sakte hain
    credits: "Raj",
    description: "Lock nicknames aur group name",
    commandCategory: "box chat",
    usages: "lock nickname on/off | lock groupname on/off | lock status",
    cooldowns: 5
};

let lockSettings = {}; // threadID wise settings store karenge

module.exports.run = async function({ api, event, args }) {
    const threadID = event.threadID;
    const type = args[0]; // nickname | groupname | status
    const action = args[1]; // on | off

    if (!lockSettings[threadID]) {
        lockSettings[threadID] = {
            lockNick: false,
            lockName: false,
            nicknames: {},
            groupName: ""
        };
    }

    switch (type) {
        case "nickname": {
            if (action === "on") {
                const info = await api.getThreadInfo(threadID);
                info.participantIDs.forEach(uid => {
                    lockSettings[threadID].nicknames[uid] = info.nicknames[uid] || "";
                });
                lockSettings[threadID].lockNick = true;
                return api.sendMessage("✅ Sabhi members ke nicknames lock ho gaye.", threadID);
            }
            if (action === "off") {
                lockSettings[threadID].lockNick = false;
                return api.sendMessage("❌ Nickname lock band kar diya gaya.", threadID);
            }
            break;
        }

        case "groupname": {
            if (action === "on") {
                const info = await api.getThreadInfo(threadID);
                lockSettings[threadID].groupName = info.threadName || "";
                lockSettings[threadID].lockName = true;
                return api.sendMessage("✅ Group name lock ho gaya.", threadID);
            }
            if (action === "off") {
                lockSettings[threadID].lockName = false;
                return api.sendMessage("❌ Group name lock band kar diya gaya.", threadID);
            }
            break;
        }

        case "status": {
            return api.sendMessage(
                `📌 Lock Status:\n- Nicknames: ${lockSettings[threadID].lockNick ? "ON" : "OFF"}\n- Group Name: ${lockSettings[threadID].lockName ? "ON" : "OFF"}`,
                threadID
            );
        }

        default:
            return api.sendMessage("❓ Use: lock [nickname|groupname|status] [on|off]", threadID);
    }
};

module.exports.handleEvent = async function({ api, event }) {
    const threadID = event.threadID;
    if (!lockSettings[threadID]) return;

    const settings = lockSettings[threadID];
    const author = event.author || event.logMessageData?.author || event.senderID;

    try {
        // Group name lock
        if (event.logMessageType === "log:thread-name" && settings.lockName) {
            if (!allowedUIDs.includes(author)) {
                if (event.logMessageData && event.logMessageData.name !== settings.groupName) {
                    await api.setTitle(settings.groupName, threadID);
                }
            } else {
                settings.groupName = event.logMessageData.name || settings.groupName;
            }
        }

        // Nickname lock
        if (event.logMessageType === "log:user-nickname" && settings.lockNick) {
            const { participant_id, nickname } = event.logMessageData;

            if (!allowedUIDs.includes(author)) {
                const oldNick = settings.nicknames[participant_id] || "";
                if (nickname !== oldNick) {
                    await api.changeNickname(oldNick, threadID, participant_id);
                }
            } else {
                settings.nicknames[participant_id] = nickname || settings.nicknames[participant_id];
            }
        }

    } catch (e) {
        console.error("Lock error:", e);
    }
};
