import { io } from "socket.io-client";

const BACKEND_URL = import.meta.env.BACKEND_URI;

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(BACKEND_URL, {
      auth: { token: localStorage.getItem("token") },
      autoConnect: true,
      transports: ["websocket"],
    });
  }

  socket.on("connect", () => {
    console.log("✅ Connected:", socket.id);
  });

  socket.on("connect_error", (err) => {
    console.log("❌ Error:", err.message);
  });

  socket.onAny((event, ...args) => {
    console.log("📡 EVENT:", event, args);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
