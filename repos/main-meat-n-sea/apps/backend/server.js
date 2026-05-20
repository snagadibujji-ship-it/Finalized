import express from "express";
import cors from "cors";
import "dotenv/config";
import { connectDB } from "./config/db.js";
import redisClient, { connectRedis } from "./config/redis.js";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

import authRouter from "./routes/authRoute.js";
import userRouter from "./routes/userRoute.js";
import vendorRouter from "./routes/vendorRoute.js";
import productRouter from "./routes/productRoute.js";
import orderRouter from "./routes/orderRoute.js";
import riderRouter from "./routes/riderRoute.js";
import adminRouter from "./routes/adminRoute.js";
import paymentRouter from "./routes/paymentRoute.js";
import { startSurgeWorker } from "./workers/surgePricing.js";

// app config
const app = express();
const httpServer = createServer(app);
const port = process.env.PORT || 4000;

// Socket.io config
const io = new Server(httpServer, {
  cors: { origin: "*" }
});

// Socket JWT Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Authentication error: No token provided"));

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error("Authentication error: Invalid token"));

    // Only allow riders and customers to use the websocket for tracking
    if (decoded.role !== 'rider' && decoded.role !== 'customer') {
      return next(new Error("Authorization error: Insufficient role"));
    }

    socket.user = decoded;
    next();
  });
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id} [Role: ${socket.user.role}]`);

  // Customer logic: Join a specific order room
  socket.on("customer:join_order", (data) => {
    if (socket.user.role !== 'customer') return;
    if (data && data.orderId) {
      const room = `order_${data.orderId}`;
      socket.join(room);
      console.log(`Customer ${socket.user.id} joined room: ${room}`);
    }
  });

  // Rider logic: Broadcast telemetry and save to Redis
  socket.on("rider:location_update", async (data) => {
    if (socket.user.role !== 'rider') return;

    // Save to Redis with 60 second TTL
    const redisKey = `rider:${socket.user.id}:location`;
    const payload = JSON.stringify({ lat: data.lat, lng: data.lng, timestamp: Date.now() });

    try {
      await redisClient.setEx(redisKey, 60, payload);
    } catch (err) {
      console.error('Redis Set Error:', err);
    }

    // Mock active delivery check: broadcast if activeOrderId is passed
    if (data.activeOrderId) {
      io.to(`order_${data.activeOrderId}`).emit("order:rider_location", {
        lat: data.lat,
        lng: data.lng
      });
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// middlewares
app.use(express.json());
app.use(cors());

// DB connection
connectDB();
connectRedis().then(() => {
  // Start background workers once Redis is connected
  startSurgeWorker();
});

// API endpoints
app.use("/images", express.static("uploads"));

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter); // Handles customers essentially
app.use("/api/vendors", vendorRouter);
app.use("/api/products", productRouter);
app.use("/api/orders", orderRouter);
app.use("/api/riders", riderRouter);
app.use("/api/admin", adminRouter);
app.use("/api/payments", paymentRouter);

app.get("/", (req, res) => {
  res.send("MEAT N SEA API is running...");
});

httpServer.listen(port, () => {
  console.log(`Server Started on port: ${port}`);
});
