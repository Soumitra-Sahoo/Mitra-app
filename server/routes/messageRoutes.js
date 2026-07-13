import express from "express";
import {
  getChatMessages,
  sendMessage,
  sseController,
  typingIndicator,
} from "../controllers/messageController.js";
import { upload } from "../configs/multer.js";
import { protect } from "../middlewares/auth.js";

const messageRouter = express.Router();

messageRouter.get("/:userId", sseController);
messageRouter.post("/send", protect, upload.single("image"), sendMessage);
messageRouter.post("/get", protect, getChatMessages);
messageRouter.post("/typing", protect, typingIndicator);

export default messageRouter;