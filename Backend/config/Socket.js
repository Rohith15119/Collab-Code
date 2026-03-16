const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let io;

async function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "https://collab-code-one.vercel.app"],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    //MIDDLEWARE
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("No Token Found"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      console.log(err);
      return next(new Error("Invalid or expired Token"));
    }
  });

  io.on("connection", (socket) => {
    // socket.user is now available here, same shape as req.user in your routes
    socket.join(`user:${socket.user.id}`); // personal notification room

    socket.on("join:session", (roomId) => {
      socket.join(roomId);
      socket.to(roomId).emit("presence:joined", {
        userId: socket.user.id,
        email: socket.user.email,
        name: socket.user.name,
      });
    });

    socket.on("leave:session", (roomId) => {
      socket.leave(roomId);
      socket.to(roomId).emit("presence:left", { userId: socket.user.id });
    });

    socket.on("code:change", ({ roomId, code, language }) => {
      socket.to(roomId).emit("code:change", {
        code,
        language,
        sender: socket.user.id,
      });
    });

    socket.on("disconnect", () => {
      console.log(`Disconnected: ${socket.user?.email}`);
    });
  });
}

function getIO() {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
}

module.exports = { initSocket, getIO };
