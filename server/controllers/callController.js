import User from "../models/User.js";
import Message from "../models/Message.js";
import { pushEvent, connections } from "./messageController.js";

const isConnected = async (myId, otherId) => {
  const me = await User.findById(myId);
  return !!me?.connections?.includes(otherId);
};

const pushEventWithRetry = async (userId, payload, attempts = 5, delayMs = 400) => {
  for (let i = 0; i < attempts; i++) {
    if (connections[userId]) {
      pushEvent(userId, payload);
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return false;
};

export const initiateCall = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { to, callType, sdp, callId } = req.body;

    if (!(await isConnected(userId, to))) {
      return res.status(403).json({
        success: false,
        message: "You can only call your connections",
      });
    }

    const caller = await User.findById(userId);
    const delivered = await pushEventWithRetry(to, {
      type: "call-incoming",
      callId,
      from: userId,
      callerInfo: {
        _id: caller._id,
        full_name: caller.full_name,
        profile_picture: caller.profile_picture,
      },
      callType,
      sdp,
    });

    if (!delivered) {
      return res.status(404).json({
        success: false,
        message: "Couldn't reach this user right now — they may be offline",
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const answerCall = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { to, callId, sdp } = req.body;

    if (!(await isConnected(userId, to))) {
      return res.status(403).json({ success: false, message: "Not connected" });
    }

    pushEvent(to, { type: "call-answered", callId, sdp });
    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendIceCandidate = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { to, callId, candidate } = req.body;

    if (!(await isConnected(userId, to))) {
      return res.status(403).json({ success: false, message: "Not connected" });
    }

    pushEvent(to, { type: "call-ice-candidate", callId, candidate });
    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const rejectCall = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { to, callId, callType, reason } = req.body;
    const message = await Message.create({
      from_user_id: to,
      to_user_id: userId,
      message_type: "call",
      call_type: callType,
      call_status: reason === "busy" ? "missed" : "declined",
    });
    const populated = await Message.findById(message._id).populate(
      "from_user_id",
    );

    pushEvent(to, {
      type: "call-rejected",
      callId,
      reason: reason || "declined",
      message: populated,
    });

    res.json({ success: true, message: populated });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const endCall = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { to, callId, callType, status, duration } = req.body;

    const message = await Message.create({
      from_user_id: userId,
      to_user_id: to,
      message_type: "call",
      call_type: callType,
      call_status: status || "completed",
      call_duration: duration || 0,
    });
    const populated = await Message.findById(message._id).populate(
      "from_user_id",
    );

    pushEvent(to, { type: "call-ended", callId, message: populated });

    res.json({ success: true, message: populated });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};