import express from "express";
import {
  getChatMessages,
  sendMessage,
  sseController,
  typingIndicator,
  editMessage,
  deleteMessageForMe,
  deleteMessageForEveryone,
  forwardMessage,
} from "../controllers/messageController.js";
import { upload } from "../configs/multer.js";
import { protect } from "../middlewares/auth.js";

const messageRouter = express.Router();

messageRouter.get("/:userId", sseController);
messageRouter.post("/send", protect, upload.single("image"), sendMessage);
messageRouter.post("/get", protect, getChatMessages);
messageRouter.post("/typing", protect, typingIndicator);
messageRouter.put("/:messageId/edit", protect, editMessage);
messageRouter.delete("/:messageId/delete-for-me", protect, deleteMessageForMe);
messageRouter.delete("/:messageId/delete-for-everyone", protect, deleteMessageForEveryone);
messageRouter.post("/forward", protect, forwardMessage);

export default messageRouter;