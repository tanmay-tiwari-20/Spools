import express from "express";
import {
  followUnFollowUser,
  getUserProfile,
  searchUser,
  loginUser,
  logoutUser,
  signupUser,
  updateUser,
  getSuggestedUsers,
  freezeAccount,
  getMe,
  updatePrivacy,
  getRelationshipList,
  getFollowRequests,
  resolveFollowRequest,
} from "../controllers/userController.js";
import protectRoute, { optionalAuth } from "../middlewares/protectRoute.js";

const router = express.Router();

router.get("/me", protectRoute, getMe);
router.get("/follow-requests", protectRoute, getFollowRequests);
router.put("/follow-requests/:requesterId", protectRoute, resolveFollowRequest);
router.put("/privacy", protectRoute, updatePrivacy);
router.get("/:id/followers", optionalAuth, (req, _res, next) => { req.params.list = "followers"; next(); }, getRelationshipList);
router.get("/:id/following", optionalAuth, (req, _res, next) => { req.params.list = "following"; next(); }, getRelationshipList);
router.get("/profile/:query", optionalAuth, getUserProfile);
router.get("/search/:query", searchUser);
router.get("/suggested", protectRoute, getSuggestedUsers);
router.post("/signup", signupUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/follow/:id", protectRoute, followUnFollowUser); // Toggle state(follow/unfollow)
router.put("/update/:id", protectRoute, updateUser);
router.put("/freeze", protectRoute, freezeAccount);

export default router;
