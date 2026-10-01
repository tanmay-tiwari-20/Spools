import express from "express";
import protectRoute from "../middlewares/protectRoute.js";
import { createCircle, deleteCircle, getCircle, joinCircle, leaveCircle, listCircles, setCircleMemberPosting, updateCircle } from "../controllers/circleController.js";

const router = express.Router();
router.get("/", protectRoute, listCircles);
router.post("/", protectRoute, createCircle);
router.put("/:id", protectRoute, updateCircle);
router.delete("/:id", protectRoute, deleteCircle);
router.put("/:id/members/:memberId/posting", protectRoute, setCircleMemberPosting);
router.get("/:id", protectRoute, getCircle);
router.put("/:id/join", protectRoute, joinCircle);
router.put("/:id/leave", protectRoute, leaveCircle);
export default router;
