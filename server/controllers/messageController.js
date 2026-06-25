import fs from "fs";
import imagekit from "../configs/imageKit.js";
import Message from "../models/Message.js";

// Create an empty object to store SSE connections
const connections = {};

// Helper to push SSE event to a user
const pushEvent = (userId, payload) => {
  if (connections[userId]) {
    connections[userId].write(`data: ${JSON.stringify(payload)}\n\n`);
  }
};

// controller function for the SSE endpoint
export const sseController = (req, res) => {
  const { userId } = req.params;
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
    // Broadcast offline status
    Object.keys(connections).forEach((connectedUserId) => {
      pushEvent(connectedUserId, { type: "user_offline", userId });
    });
    console.log("Client disconnected:", userId);
  });
};

// Typing indicator — called via POST, pushes SSE to recipient
export const typingIndicator = (req, res) => {
  try {
    const { from, to, isTyping } = req.body;
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
      const fileBuffer = fs.readFileSync(image.path);
      const response = await imagekit.upload({
        file: fileBuffer,
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
