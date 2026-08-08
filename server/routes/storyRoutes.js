import express from "express";
import { uploadStoryMedia } from "../configs/multer.js";
import { protect } from "../middlewares/auth.js";
import { addUserStory, getStories, markStoryViewed } from "../controllers/storyController.js";

const storyRouter = express.Router();

storyRouter.get("/get", protect, getStories);
storyRouter.post("/create", protect, uploadStoryMedia.single("media"), addUserStory);
storyRouter.post("/:storyId/view", protect, markStoryViewed);

export default storyRouter;