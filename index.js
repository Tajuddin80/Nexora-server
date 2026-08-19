// Bun polyfill for node:v8 isBuildingSnapshot (only runs under Bun runtime)
if (typeof process !== "undefined" && process.versions && process.versions.bun && process.getBuiltinModule) {
  const orig = process.getBuiltinModule.bind(process);
  process.getBuiltinModule = function (name) {
    if (name === "v8") {
      return {
        startupSnapshot: {
          isBuildingSnapshot: () => false,
        },
      };
    }
    return orig(name);
  };
}

require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const { initRentCron } = require("./cron/rentCron");
const Message = require("./models/Message");

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH"],
  },
});

io.on("connection", (socket) => {
  socket.on("join_room", (userEmail) => {
    if (userEmail) {
      const lower = userEmail.toLowerCase();
      socket.join(lower);
      if (lower === "admin@nexora.com" || lower === process.env.ADMIN_EMAIL?.toLowerCase()) {
        socket.join("admin_room");
      }
    }
  });

  socket.on("send_message", async (data) => {
    try {
      const { senderEmail, recipientEmail, message, type, mediaUrl } = data;
      const newMsg = await Message.create({
        senderEmail,
        recipientEmail,
        message: message || "",
        type: type || "text",
        mediaUrl: mediaUrl || "",
        read: false,
      });

      const recipientLower = (recipientEmail || "").toLowerCase();
      const senderLower = (senderEmail || "").toLowerCase();

      io.to(recipientLower).emit("receive_message", newMsg);
      io.to(senderLower).emit("receive_message", newMsg);

      if (recipientLower === "admin@nexora.com" || recipientLower === process.env.ADMIN_EMAIL?.toLowerCase()) {
        io.to("admin_room").emit("receive_message", newMsg);
      }
    } catch (err) {
      console.error("Socket send_message error:", err.message);
    }
  });

  socket.on("mark_read", async ({ userEmail, senderEmail }) => {
    try {
      await Message.updateMany(
        { senderEmail, recipientEmail: userEmail, read: false },
        { $set: { read: true } }
      );
      io.to(senderEmail?.toLowerCase()).emit("messages_read", { userEmail, senderEmail });
    } catch (err) {
      console.error("Socket mark_read error:", err.message);
    }
  });
});

if (!process.env.VERCEL) {
  initRentCron();
  server.listen(PORT, () => {
    console.log(`Nexora HTTP & Socket.IO server listening on port ${PORT}`);
  });
}

module.exports = app;
