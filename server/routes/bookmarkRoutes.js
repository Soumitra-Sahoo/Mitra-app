import express from "express";
import { protect } from "../middlewares/auth.js";
import {
  toggleBookmark,
  getBookmarks,
  getBookmarkedPostIds,
} from "../controllers/bookmarkController.js";

const bookmarkRouter = express.Router();

bookmarkRouter.post("/toggle", protect, toggleBookmark);
bookmarkRouter.get("/", protect, getBookmarks);
bookmarkRouter.get("/ids", protect, getBookmarkedPostIds);

export default bookmarkRouter;