import express from "express";
import { upload } from "../configs/multer.js";
import { protect } from "../middlewares/auth.js";
import {
  addPost,
  getFeedPosts,
  likePost,
  getPostsByHashtag,
  getTrendingHashtags,
  deletePost,
} from "../controllers/postController.js";

const postRouter = express.Router();

postRouter.post("/add", protect, upload.array("images", 4), addPost);
postRouter.get("/feed", protect, getFeedPosts);
postRouter.post("/like", protect, likePost);
postRouter.get("/hashtag/:tag", protect, getPostsByHashtag);
postRouter.get("/trending-hashtags", protect, getTrendingHashtags);
postRouter.delete("/:postId", protect, deletePost);

export default postRouter;