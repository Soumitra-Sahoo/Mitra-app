import express from "express";
import { protect } from "../middlewares/auth.js";
import { upload } from "../configs/multer.js";
import {
  createGroup,
  addMember,
  removeMember,
  leaveGroup,
  setAdminRole,
  updateGroupInfo,
  getGroupInfo,
  getUserGroups,
} from "../controllers/groupController.js";

const groupRouter = express.Router();

groupRouter.post("/create", protect, createGroup);
groupRouter.get("/", protect, getUserGroups);
groupRouter.get("/:groupId", protect, getGroupInfo);
groupRouter.post("/:groupId/members", protect, addMember);
groupRouter.delete("/:groupId/members/:memberId", protect, removeMember);
groupRouter.post("/:groupId/leave", protect, leaveGroup);
groupRouter.put("/:groupId/members/:memberId/role", protect, setAdminRole);
groupRouter.put("/:groupId", protect, upload.single("photo"), updateGroupInfo);

export default groupRouter;