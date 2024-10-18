import path from "path";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./db/connectDB.js";
import cookieParser from "cookie-parser";
import userRoutes from "./Routes/userRoutes.js";
import postRoutes from "./Routes/postRoutes.js";
import messageRoutes from "./Routes/messageRoutes.js";
import { v2 as cloudinary } from "cloudinary";
import { app, server } from "./socket/socket.js";
import helmet from "helmet";
import job from "./cron/cron.js";

dotenv.config();

connectDB();
job.start();

const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Enable CORS for your frontend domain
app.use(
  cors({
    origin: "https://spools.onrender.com/", // Replace with your frontend domain
    credentials: true,
  })
);

// Helmet Security Headers with relaxed CSP for API and Cloudinary
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", "https:"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      connectSrc: ["'self'", "https://spools.onrender.com"], // Allow API requests from frontend
    },
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files (for local images, if any)
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Adjust if necessary

// Routes
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/messages", messageRoutes);

// Serve frontend in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/dist")));

  // React app
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });
}

// Error handling middleware with detailed logging
app.use((err, req, res, next) => {
  console.error("Error details:", err);
  res
    .status(err.status || 500)
    .json({ message: err.message || "Something went wrong!" });
});

server.listen(PORT, () => console.log(`Server started at ${PORT}`));
