import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function connectSocket(userId: string) {
  if (socket) return socket;

  const apiUrl = import.meta.env.VITE_API_URL || "";

  socket = io(apiUrl, {
    query: { userId },
  });

  socket.on("connect", () => {
    console.log("Connected to WebSocket server");
  });

  socket.on("disconnect", () => {
    console.log("Disconnected from WebSocket server");
  });

  return socket;
}

export function getSocket() {
  return socket;
}
