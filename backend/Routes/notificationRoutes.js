import express from "express";
import protectRoute from "../middlewares/protectRoute.js";
import {
  getNotificationConfig,
  getNotificationSubscription,
  saveNotificationPreferences,
  subscribeToNotifications,
  unsubscribeFromNotifications,
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/config", getNotificationConfig);
router.get("/subscription", protectRoute, getNotificationSubscription);
router.put("/preferences", protectRoute, saveNotificationPreferences);
router.post("/subscribe", protectRoute, subscribeToNotifications);
router.delete("/subscribe", protectRoute, unsubscribeFromNotifications);

export default router;
