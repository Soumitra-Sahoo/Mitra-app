import express from "express";
import { protect } from "../middlewares/auth.js";
import {
  initiateCall,
  answerCall,
  sendIceCandidate,
  rejectCall,
  endCall,
} from "../controllers/callController.js";

const callRouter = express.Router();

callRouter.post("/initiate", protect, initiateCall);
callRouter.post("/answer", protect, answerCall);
callRouter.post("/ice-candidate", protect, sendIceCandidate);
callRouter.post("/reject", protect, rejectCall);
callRouter.post("/end", protect, endCall);

export default callRouter;