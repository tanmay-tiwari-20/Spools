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
  socket.on("markMessagesAsSeen", async ({ conversationId }) => {
    try {
      if (!userId || userId === "undefined" || !conversationId) return;
      const conversation = await Conversation.findById(conversationId).select("participants lastMessage");
      if (!conversation) return;
      const isParticipant = conversation.participants.some((participant) => participant.toString() === userId);
      if (!isParticipant) return;

      const senderId = conversation.participants.find((participant) => participant.toString() !== userId)?.toString();
      if (!senderId) return;

      const update = await Message.updateMany(
        { conversationId, sender: senderId, seen: false },
        { $set: { seen: true } }
      );
      if (conversation.lastMessage?.sender?.toString() === senderId && update.modifiedCount > 0) {
        await Conversation.updateOne({ _id: conversationId }, { $set: { "lastMessage.seen": true } });
      }

      const senderSocketId = getRecipientSocketId(senderId);
      if (senderSocketId && update.modifiedCount > 0) {
        io.to(senderSocketId).emit("messagesSeen", { conversationId, readerId: userId });
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
