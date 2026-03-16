import { useEffect, useRef } from "react";
import { getSocket } from "../socket";

export function useSocket(events = {}) {
  const socketRef = useRef(null);
  const eventsRef = useRef(events);
  eventsRef.current = events;

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    if (!socket.connected) socket.connect();

    const handlers = eventsRef.current;

    // Register all passed event listeners
    Object.entries(handlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      // Cleanup only the listeners, don't disconnect
      // (socket stays alive across pages for global notifications)
      Object.entries(handlers).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    };
  }, []); // ✅ runs once — handlers are stable refs via useCallback in caller

  return socketRef.current ?? getSocket();
}
