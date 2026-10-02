import express from "express";
import protectRoute from "../middlewares/protectRoute.js";
import {
  getMessages,
  sendMessage,
  deleteMessage,
  getConversations,
} from "../controllers/messageController.js";

const router = express.Router();

router.get("/conversations", protectRoute, getConversations);
router.delete("/:messageId", protectRoute, deleteMessage);
router.get("/:otherUserId", protectRoute, getMessages);
router.post("/", protectRoute, sendMessage);

export default router;
