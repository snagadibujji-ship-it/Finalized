import express from "express";
import cors from "cors";
import "dotenv/config";
import { connectDB } from "./config/db.js";
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

  socket.on("rider:location_update", (data) => {
    if (socket.user.role !== 'rider') return;
    console.log(`[RIDER LOC UPDATE] Rider ID: ${socket.user.id} -> Lat: ${data.lat}, Lng: ${data.lng}`);
    // In future phases: save to Redis, broadcast to customer, etc.
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

// API endpoints
app.use("/images", express.static("uploads"));

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter); // Handles customers essentially
app.use("/api/vendors", vendorRouter);
app.use("/api/products", productRouter);
app.use("/api/orders", orderRouter);
app.use("/api/riders", riderRouter);
app.use("/api/admin", adminRouter);

app.get("/", (req, res) => {
  res.send("MEAT N SEA API is running...");
});

httpServer.listen(port, () => {
  console.log(`Server Started on port: ${port}`);
});
