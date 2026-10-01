import express from "express";
import {
  createPost,
  deletePost,
  getPost,
  likeUnlikePost,
  replyToPost,
  getFeedPosts,
  getUserPosts,
  getUserReplies,
  saveUnsavePost,
  getSavedPosts,
  repostPost,
} from "../controllers/postController.js";
import protectRoute, { optionalAuth } from "../middlewares/protectRoute.js";

const router = express.Router();

router.get("/feed", protectRoute, getFeedPosts);
router.get("/saved", protectRoute, getSavedPosts);
router.get("/user/:username", optionalAuth, getUserPosts);
router.get("/replies/:username", optionalAuth, getUserReplies);
router.get("/:id", optionalAuth, getPost);
router.post("/create", protectRoute, createPost);
router.delete("/:id", protectRoute, deletePost);
router.put("/like/:id", protectRoute, likeUnlikePost);
router.put("/reply/:id", protectRoute, replyToPost);
router.put("/save/:id", protectRoute, saveUnsavePost);
router.put("/repost/:id", protectRoute, repostPost);

export default router;
