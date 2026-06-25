import express from "express";
import { upload } from "../configs/multer.js";
import { protect } from "../middlewares/auth.js";
import {
  addPost,
  getFeedPosts,
  likePost,
  getPostsByHashtag,
  getTrendingHashtags,
} from "../controllers/postController.js";

const postRouter = express.Router();

postRouter.post("/add", upload.array("images", 4), protect, addPost);
postRouter.get("/feed", protect, getFeedPosts);
postRouter.post("/like", protect, likePost);
postRouter.get("/hashtag/:tag", protect, getPostsByHashtag);
postRouter.get("/trending-hashtags", protect, getTrendingHashtags);

export default postRouter;
