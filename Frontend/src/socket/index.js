import { io } from "socket.io-client";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(BACKEND_URL, {
      auth: { token: localStorage.getItem("token") },
      autoConnect: true,
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
