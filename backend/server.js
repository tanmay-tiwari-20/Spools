import path from "path";
import { readFile } from "node:fs/promises";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./db/connectDB.js";
import cookieParser from "cookie-parser";
import userRoutes from "./Routes/userRoutes.js";
import postRoutes from "./Routes/postRoutes.js";
import messageRoutes from "./Routes/messageRoutes.js";
import circleRoutes from "./Routes/circleRoutes.js";
import seriesRoutes from "./Routes/seriesRoutes.js";
import notificationRoutes from "./Routes/notificationRoutes.js";
import { v2 as cloudinary } from "cloudinary";
import { app, server } from "./socket/socket.js";
import helmet from "helmet";
import job from "./cron/cron.js";
import User from "./models/userModel.js";
import Post from "./models/postModel.js";

dotenv.config();

connectDB();
job.start();

const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();
const frontendIndexPath = path.join(__dirname, "frontend", "dist", "index.html");
let frontendIndexHtml;

const escapeHtml = (value = "") => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");

const getSiteOrigin = (req) => {
  const configuredOrigin = process.env.FRONTEND_URL?.trim();
  if (configuredOrigin) return new URL(configuredOrigin).origin;
  const protocol = req.get("x-forwarded-proto")?.split(",")[0] || req.protocol;
  return `${protocol}://${req.get("host")}`;
};

const absoluteImageUrl = (image, origin) => {
  if (!image || typeof image !== "string") return null;
  try {
    return new URL(image, origin).href;
  } catch {
    return null;
  }
};

const renderSharePage = async (req, metadata) => {
  frontendIndexHtml ||= await readFile(frontendIndexPath, "utf8");
  const origin = getSiteOrigin(req);
  const image = absoluteImageUrl(metadata.image, origin);
  const pageUrl = new URL(req.originalUrl, origin).href;
  const cardType = image ? "summary_large_image" : "summary";
  const tags = [
    `<title>${escapeHtml(metadata.title)}</title>`,
    `<meta name="description" content="${escapeHtml(metadata.description)}" />`,
    `<link rel="canonical" href="${escapeHtml(pageUrl)}" />`,
    `<meta property="og:type" content="${escapeHtml(metadata.type || "website")}" />`,
    `<meta property="og:site_name" content="Spools" />`,
    `<meta property="og:title" content="${escapeHtml(metadata.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(metadata.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(pageUrl)}" />`,
    image ? `<meta property="og:image" content="${escapeHtml(image)}" />` : "",
    image ? `<meta property="og:image:alt" content="${escapeHtml(metadata.imageAlt || metadata.title)}" />` : "",
    metadata.username ? `<meta property="profile:username" content="${escapeHtml(metadata.username)}" />` : "",
    `<meta name="twitter:card" content="${cardType}" />`,
    `<meta name="twitter:title" content="${escapeHtml(metadata.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(metadata.description)}" />`,
    image ? `<meta name="twitter:image" content="${escapeHtml(image)}" />` : "",
  ].filter(Boolean).join("\n  ");

  const html = frontendIndexHtml
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/\s*<meta\s+(?:name|property)=["'](?:description|og:[^"']+|twitter:[^"']+|profile:[^"']+)["'][^>]*\/?\s*>/gi, "")
    .replace(/\s*<link\s+rel=["']canonical["'][^>]*\/?\s*>/gi, "")
    .replace(/<\/head>/i, `  ${tags}\n</head>`);
  return html;
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const allowedOrigins = [
  "https://spools.onrender.com",
  "http://localhost:3000",
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

// Enable CORS
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// Helmet Security Headers with relaxed CSP for API and Cloudinary
app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", "https:"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:", "https://accounts.google.com/gsi/client"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:", "https://accounts.google.com/gsi/style"],
      connectSrc: ["'self'", "https://spools.onrender.com", "https://accounts.google.com/gsi/"], // Allow API requests and Google Identity Services
      frameSrc: ["'self'", "https://accounts.google.com/gsi/"],
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
app.use("/api/circles", circleRoutes);
app.use("/api/series", seriesRoutes);
app.use("/api/notifications", notificationRoutes);

// Serve frontend in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/dist"), { index: false }));

  app.get("/", async (req, res, next) => {
    try {
      const html = await renderSharePage(req, {
        title: "Spools — share ideas and conversations",
        description: "A place to share ideas, stories, and conversations.",
        image: "/pwa-512x512.png",
        imageAlt: "Spools",
      });
      res.type("html").send(html);
    } catch (error) {
      next(error);
    }
  });

  app.get("/:username/post/:pid", async (req, res, next) => {
    try {
      const post = await Post.findById(req.params.pid)
        .select("text img postedBy isFrozen")
        .populate("postedBy", "name username profilePic isFrozen isPrivate")
        .lean();
      const author = post?.postedBy;
      if (!post || !author || author.isFrozen || author.isPrivate) return next();

      const username = author.username || req.params.username;
      const title = post.img || author.profilePic
        ? `Spool by ${author.name || `@${username}`} (@${username}) · Spools`
        : `Spool by @${username} · Spools`;
      const description = String(post.text || `A Spool shared by @${username} on Spools.`).replace(/\s+/g, " ").trim().slice(0, 240);
      const html = await renderSharePage(req, {
        title,
        description,
        image: post.img || author.profilePic,
        imageAlt: `Spool by @${username}`,
        type: "article",
        username,
      });
      res.type("html").send(html);
    } catch (error) {
      next(error);
    }
  });

  app.get("/:username", async (req, res, next) => {
    try {
      const profile = await User.findOne({ username: req.params.username })
        .select("name username bio profilePic isFrozen")
        .lean();
      if (!profile || profile.isFrozen) return next();

      const hasProfilePicture = Boolean(profile.profilePic);
      const title = hasProfilePicture && profile.name
        ? `${profile.name} (@${profile.username}) · Spools`
        : `@${profile.username} · Spools`;
      const description = hasProfilePicture && profile.bio?.trim()
        ? profile.bio.trim().slice(0, 240)
        : `View @${profile.username}'s profile on Spools.`;
      const html = await renderSharePage(req, {
        title,
        description,
        image: profile.profilePic,
        imageAlt: `@${profile.username} on Spools`,
        type: "profile",
        username: profile.username,
      });
      res.type("html").send(html);
    } catch (error) {
      next(error);
    }
  });

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

server.listen(PORT, "0.0.0.0", () => console.log(`Server started at http://localhost:${PORT}`));
