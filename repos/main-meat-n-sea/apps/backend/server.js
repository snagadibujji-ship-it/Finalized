import express from "express";
import cors from "cors";
import "dotenv/config";
import { connectDB } from "./config/db.js";

import authRouter from "./routes/authRoute.js";
import userRouter from "./routes/userRoute.js";
import vendorRouter from "./routes/vendorRoute.js";
import productRouter from "./routes/productRoute.js";
import orderRouter from "./routes/orderRoute.js";
import riderRouter from "./routes/riderRoute.js";
import adminRouter from "./routes/adminRoute.js";

// app config
const app = express();
const port = process.env.PORT || 4000;

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

app.listen(port, () => {
  console.log(`Server Started on port: ${port}`);
});
