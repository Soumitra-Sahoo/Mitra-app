import express from "express";
import { protect } from "../middlewares/auth.js";
import {
  addComment,
  getComments,
  deleteComment,
  likeComment,
  getCommentCount,
} from "../controllers/commentController.js";

const commentRouter = express.Router();

commentRouter.post("/add", protect, addComment);
commentRouter.get("/:post_id", protect, getComments);
commentRouter.get("/count/:post_id", protect, getCommentCount);
commentRouter.delete("/:comment_id", protect, deleteComment);
commentRouter.post("/like/:comment_id", protect, likeComment);

export default commentRouter;
