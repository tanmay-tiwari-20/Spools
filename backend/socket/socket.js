import { Server } from "socket.io";
import http from "http";
import express from "express";
import Message from "../models/messageModel.js";
import Conversation from "../models/conversationModel.js";

const app = express();
const allowedOrigins = [
  "https://spools.onrender.com",
  "http://localhost:3000",
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const userSocketMap = {}; // userId: socketId

export const getRecipientSocketId = (recipientId) => {
  return userSocketMap[recipientId];
};

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;

  // Only add the user if a valid userId is provided
  if (userId && userId !== "undefined") {
    userSocketMap[userId] = socket.id;
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  }

  // Mark messages as seen event
  socket.on("markMessagesAsSeen", async ({ conversationId, userId }) => {
    try {
      // Update unseen messages in the specified conversation
      await Message.updateMany(
        { conversationId: conversationId, seen: false, recipient: userId },
        { $set: { seen: true } }
      );

      // Update the lastMessage in the conversation to seen
      await Conversation.updateOne(
        { _id: conversationId },
        { $set: { "lastMessage.seen": true } }
      );

      // Notify the recipient that messages have been seen
      const recipientSocketId = getRecipientSocketId(userId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("messagesSeen", { conversationId });
      }
    } catch (error) {
      console.error("Error marking messages as seen:", error);
    }
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    if (userId && userId !== "undefined") {
      delete userSocketMap[userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }
  });
});

export { io, server, app };
