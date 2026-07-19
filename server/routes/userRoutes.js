import express from "express";
import { protect } from "../middlewares/auth.js";
import {
  acceptConnectionRequest,
  discoverUsers,
  followUser,
  getUserConnections,
  getUserData,
  getUserProfiles,
  sendConnectionReqest,
  unfollowUser,
  updateUserData,
  getPeopleYouMayKnow,
  getOnboardingStatus,
} from "../controllers/userController.js";
import { upload } from "../configs/multer.js";
import { getUserRecentMessages } from "../controllers/messageController.js";

const userRouter = express.Router();

userRouter.get("/data", protect, getUserData);
userRouter.post(
  "/update",
  protect,
  upload.fields([
    { name: "profile", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  updateUserData,
);
userRouter.post("/discover", protect, discoverUsers);
userRouter.post("/follow", protect, followUser);
userRouter.post("/unfollow", protect, unfollowUser);
userRouter.post("/connect", protect, sendConnectionReqest);
userRouter.post("/accept", protect, acceptConnectionRequest);
userRouter.get("/connections", protect, getUserConnections);
userRouter.post("/profiles", protect, getUserProfiles);
userRouter.get("/recent-messages", protect, getUserRecentMessages);
userRouter.get("/may-know", protect, getPeopleYouMayKnow);
userRouter.get("/onboarding", protect, getOnboardingStatus);

export default userRouter;