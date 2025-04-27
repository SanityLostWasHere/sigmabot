const io = require("socket.io-client");
const socket = io("https://classic.talkomatic.co");
let users = {};

socket.on("connect", async () => {
    console.log("Socket connected!");

    socket.emit("join lobby", {
        username: "SigmaBot",
        location: "BotBotBot"
    });

    socket.emit("join room", {
        roomId: "219456"
    });
});

socket.on("room joined", async (data) => {
    sendMessage("Hello, world!");

    users = Object.fromEntries(data.users.map(user => {
        if (!user.username) user.username = "Anonymous";
        if (!user.location) user.location = "Unknown";

        user.typing = data.currentMessages[user.id];
        return [user.id, user];
    }));
});
socket.on("user joined", async (user) => {
    delete user.roomName;
    delete user.roomType;
    user.typing = "";
    users[user.id] = user;
});
socket.on("user left", async (user_id) => {
    const user = users[user_id];
    if (!user) return;

    delete users[user.id];
});

socket.on("chat update", async (data) => {
    const author = users[data.userId];
    if (!author) return;

    const prev_content = author.typing;

    if (data.diff) {
        if (data.diff.type == "full-replace") {
            author.typing = data.diff.text;
        } else {
            const cur_text = author.typing;
            let new_text;

            switch (data.diff.type) {
                case "add":
                    new_text = cur_text.slice(0, data.diff.index) + data.diff.text + cur_text.slice(data.diff.index);
                    break;
                case "delete":
                    new_text = cur_text.slice(0, data.diff.index) + cur_text.slice(data.diff.index + data.diff.count);
                    break;
                case "replace":
                    new_text = cur_text.slice(0, data.diff.index) + data.diff.text + cur_text.slice(data.diff.index + data.diff.text.length + 1);
                    break;
                default:
                    new_text = cur_text;
                    break;
            }

            author.typing = new_text;
        }
    } else {
        author.typing = data.message;
    }
});

function sendMessage(text) {
    socket.emit("chat update", {
        diff: {
            type: "full-replace",
            text: text
        }
    });
}