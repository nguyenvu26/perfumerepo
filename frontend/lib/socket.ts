import { io, Socket } from "socket.io-client";
import { env } from "@/lib/env";
import { auth } from "@/lib/auth";

function getSocketBaseUrl() {
  // env.NEXT_PUBLIC_API_URL typically ends with /api/v1
  return env.NEXT_PUBLIC_API_URL.replace(/\/api\/v1\/?$/i, "");
}

let chatSocket: Socket | null = null;

export function getChatSocket(): Socket {
  if (chatSocket) return chatSocket;

  const token = auth.getToken();
  chatSocket = io(getSocketBaseUrl() + "/chat", {
    transports: ["websocket"],
    auth: token ? { token } : undefined,
  });

  return chatSocket;
}

export function resetChatSocket() {
  if (chatSocket) {
    chatSocket.disconnect();
    chatSocket = null;
  }
}

let notificationSocket: Socket | null = null;

export function getNotificationSocket(): Socket {
  if (notificationSocket) return notificationSocket;

  const token = auth.getToken();
  notificationSocket = io(getSocketBaseUrl() + "/notifications", {
    transports: ["websocket"],
    auth: token ? { token } : undefined,
  });

  return notificationSocket;
}

export function resetNotificationSocket() {
  if (notificationSocket) {
    notificationSocket.disconnect();
    notificationSocket = null;
  }
}
