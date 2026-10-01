import express from "express";
import protectRoute from "../middlewares/protectRoute.js";
import { createCircle, getCircle, joinCircle, leaveCircle, listCircles } from "../controllers/circleController.js";

const router = express.Router();
router.get("/", protectRoute, listCircles);
router.post("/", protectRoute, createCircle);
router.get("/:id", protectRoute, getCircle);
router.put("/:id/join", protectRoute, joinCircle);
router.put("/:id/leave", protectRoute, leaveCircle);
export default router;
