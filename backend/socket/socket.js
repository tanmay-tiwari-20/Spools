import { Server } from "socket.io";
import http from "http";
import express from "express";
import Message from "../models/messageModel.js";
import Conversation from "../models/conversationModel.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const userSocketMap = {}; // userId: socketId

// Utility function to get a recipient's socket ID
export const getRecipientSocketId = (recipientId) => {
  return userSocketMap[recipientId] || null;
};

// Socket connection logic
io.on("connection", (socket) => {
  console.log("User connected", socket.id);

  // Extract userId from the socket handshake query
  const userId = socket.handshake.query.userId;

  // Store the socket ID if userId is valid
  if (userId && userId !== "undefined") {
    userSocketMap[userId] = socket.id;
    console.log(`User ${userId} is now online with socket ID: ${socket.id}`);
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  } else {
    console.warn(`Invalid userId received in handshake: ${userId}`);
  }

  // Handle marking messages as seen
  socket.on("markMessagesAsSeen", async ({ conversationId, userId }) => {
    try {
      console.log(
        `Marking messages as seen for conversationId: ${conversationId}, by userId: ${userId}`
      );

      // Update all unseen messages in the conversation to seen
      const messageUpdateResult = await Message.updateMany(
        { conversationId: conversationId, seen: false },
        { $set: { seen: true } }
      );

      // Update the last message in the conversation to seen
      const conversationUpdateResult = await Conversation.updateOne(
        { _id: conversationId },
        { $set: { "lastMessage.seen": true } }
      );

      console.log("Message update result:", messageUpdateResult);
      console.log("Conversation update result:", conversationUpdateResult);

      // Emit the messagesSeen event to the user
      if (userSocketMap[userId]) {
        io.to(userSocketMap[userId]).emit("messagesSeen", { conversationId });
      }
    } catch (error) {
      console.error("Error marking messages as seen:", error);
    }
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    console.log(`User ${userId} disconnected with socket ID: ${socket.id}`);
    if (userId && userSocketMap[userId]) {
      delete userSocketMap[userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
      console.log(`User ${userId} removed from online users.`);
    }
  });
});

export { io, server, app };
