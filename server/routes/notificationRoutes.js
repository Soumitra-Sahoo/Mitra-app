import express from "express";
import { protect } from "../middlewares/auth.js";
import {
  getNotifications,
  markAllRead,
  markOneRead,
  getUnreadCount,
} from "../controllers/notificationController.js";

const notificationRouter = express.Router();

notificationRouter.get("/", protect, getNotifications);
notificationRouter.get("/unread", protect, getUnreadCount);
notificationRouter.put("/read-all", protect, markAllRead);
notificationRouter.put("/read/:id", protect, markOneRead);

export default notificationRouter;
