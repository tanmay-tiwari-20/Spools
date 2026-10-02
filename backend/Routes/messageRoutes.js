import express from "express";
import multer from "multer";
import protectRoute from "../middlewares/protectRoute.js";
import {
  getMessages,
  sendMessage,
  forwardMessage,
  deleteMessage,
  getConversations,
} from "../controllers/messageController.js";

const router = express.Router();
const receiveAudio = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 16 * 1024 * 1024, files: 1, fields: 8 },
  fileFilter: (_req, file, callback) => {
    if (file.mimetype.startsWith("audio/")) return callback(null, true);
    return callback(new Error("Please upload a valid audio recording."));
  },
}).single("audioFile");

const handleAudioUpload = (req, res, next) => {
  receiveAudio(req, res, (error) => {
    if (!error) return next();
    const isTooLarge = error.code === "LIMIT_FILE_SIZE";
    return res.status(isTooLarge ? 413 : 400).json({
      error: isTooLarge ? "Voice messages must be 16 MB or smaller." : error.message,
    });
  });
};

router.get("/conversations", protectRoute, getConversations);
router.post("/:messageId/forward", protectRoute, forwardMessage);
router.delete("/:messageId", protectRoute, deleteMessage);
router.get("/:otherUserId", protectRoute, getMessages);
router.post("/", protectRoute, handleAudioUpload, sendMessage);

export default router;
