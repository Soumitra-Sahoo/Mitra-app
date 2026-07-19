import imagekit from "../configs/imageKit.js";
import Message from "../models/Message.js";
import { verifyToken } from "@clerk/backend";

// Create an empty object to store SSE connections
const connections = {};

// Helper to push SSE event to a user
const pushEvent = (userId, payload) => {
  if (process.env.NODE_ENV !== "production") {
    console.log(
      `[pushEvent] type=${payload.type} to=${userId} connected?=${!!connections[userId]}`,
    );
  }
  if (connections[userId]) {
    connections[userId].write(`data: ${JSON.stringify(payload)}\n\n`);
  }
};

export const sseController = async (req, res) => {
  const { userId } = req.params;
  const { token } = req.query;

  let authUserId;
  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    authUserId = payload.sub;
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }

  // A user may only open a stream for their own inbox — otherwise anyone
  // could read someone else's messages/typing/presence by guessing an id.
  if (authUserId !== userId) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  console.log("New client connected : ", userId);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL);

  connections[userId] = res;

  // Broadcast online status to everyone connected
  Object.keys(connections).forEach((connectedUserId) => {
    if (connectedUserId !== userId) {
      pushEvent(connectedUserId, { type: "user_online", userId });
    }
  });

  res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);

  // Send current online users list to the newly connected user
  const onlineUsers = Object.keys(connections).filter((id) => id !== userId);
  res.write(
    `data: ${JSON.stringify({ type: "online_users", users: onlineUsers })}\n\n`,
  );

  req.on("close", () => {
    delete connections[userId];
    Object.keys(connections).forEach((connectedUserId) => {
      pushEvent(connectedUserId, { type: "user_offline", userId });
    });
    console.log("Client disconnected:", userId);
  });
};

export const typingIndicator = (req, res) => {
  try {
    const { userId: from } = req.auth();
    const { to, isTyping } = req.body;
    pushEvent(to, { type: "typing", from, isTyping });
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Send Message
export const sendMessage = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { to_user_id, text } = req.body;
    const image = req.file;

    let media_url = "";
    let message_type = image ? "image" : "text";

    if (message_type === "image") {
      const response = await imagekit.upload({
        file: image.buffer,
        fileName: image.originalname,
      });
      media_url = imagekit.url({
        path: response.filePath,
        transformation: [
          { quality: "auto" },
          { format: "webp" },
          { width: "1280" },
        ],
      });
    }

    const message = await Message.create({
      from_user_id: userId,
      to_user_id,
      text,
      message_type,
      media_url,
      delivered: !!connections[to_user_id],
    });

    res.json({ success: true, message });

    const messageWithUserData = await Message.findById(message._id).populate(
      "from_user_id",
    );
    pushEvent(to_user_id, messageWithUserData);
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Get Chat Messages
export const getChatMessages = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { to_user_id } = req.body;

    const messages = await Message.find({
      $or: [
        { from_user_id: userId, to_user_id },
        { from_user_id: to_user_id, to_user_id: userId },
      ],
    }).sort({ createdAt: -1 });

    await Message.updateMany(
      { from_user_id: to_user_id, to_user_id: userId },
      { seen: true },
    );

    pushEvent(to_user_id, { type: "seen", by: userId });

    res.json({ success: true, messages });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const getUserRecentMessages = async (req, res) => {
  try {
    const { userId } = req.auth();
    const messages = await Message.find({ to_user_id: userId })
      .populate("from_user_id to_user_id")
      .sort({ createdAt: -1 });
    res.json({ success: true, messages });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export { connections, pushEvent };