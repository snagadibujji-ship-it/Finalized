import { Server as SocketIOServer } from "socket.io";
import type { Server as HttpServer } from "http";
import { verifyToken } from "./auth";

let io: SocketIOServer | null = null;

export function initSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    path: "/api/socket.io",
  });

  io.use((socket, next) => {
    const token =
      (socket.handshake.auth["token"] as string) ||
      (socket.handshake.query["token"] as string);

    if (!token) {
      socket.data["guest"] = true;
      next();
      return;
    }

    try {
      const payload = verifyToken(token);
      socket.data["user"] = payload;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data["user"] as
      | { userId: number; role: string }
      | undefined;

    if (user) {
      socket.join(`user:${user.userId}`);

      if (user.role === "vendor") {
        socket.on("join:shop", (shopId: number) => {
          socket.join(`shop:${shopId}`);
        });
      }

      if (user.role === "delivery") {
        socket.join("riders");
      }
    }
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
}
