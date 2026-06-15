import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

function socketOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";
  if (apiUrl.startsWith("http")) {
    return apiUrl.replace(/\/api\/v1\/?$/, "");
  }
  return "";
}

export function connectSocket(): Socket | null {
  if (socket?.connected) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  const origin = socketOrigin();
  if (!origin) {
    return null;
  }

  socket = io(`${origin}/events`, {
    withCredentials: true,
    transports: ["websocket", "polling"],
  });

  if (process.env.NODE_ENV === "development") {
    socket.on("connect", () => {
      console.log("Socket connected:", socket?.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
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
