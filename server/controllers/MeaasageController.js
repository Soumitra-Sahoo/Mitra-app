import imagekit from "../configs/imageKit.js";
import Message from "../models/Message.js";
import { verifyToken } from "@clerk/backend";
import { isConnected } from "../utils/isConnected.js";
import { checkGroupMembership } from "./groupController.js";

const EDIT_WINDOW_MS = 10 * 60 * 1000; 
const DELETE_FOR_EVERYONE_WINDOW_MS = 60 * 60 * 1000; 

const connections = {};

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

  if (authUserId !== userId) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  console.log("New client connected : ", userId);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL);

  connections[userId] = res;
  Object.keys(connections).forEach((connectedUserId) => {
    if (connectedUserId !== userId) {
      pushEvent(connectedUserId, { type: "user_online", userId });
    }
  });

  res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);

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

export const typingIndicator = async (req, res) => {
  try {
    const { userId: from } = req.auth();
    const { to, group_id, isTyping } = req.body;

    if (group_id) {
      const check = await checkGroupMembership(group_id, from);
      if (check.group) {
        check.group.members
          .filter((m) => m.user_id !== from)
          .forEach((m) => pushEvent(m.user_id, { type: "typing", from, isTyping, group_id }));
      }
    } else {
      pushEvent(to, { type: "typing", from, isTyping });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { to_user_id, group_id, text, reply_to } = req.body;
    const image = req.file;

    if (!to_user_id && !group_id) {
      return res.status(400).json({ success: false, message: "Missing recipient" });
    }

    let group = null;
    if (group_id) {
      const check = await checkGroupMembership(group_id, userId);
      if (!check.group) {
        return res.status(404).json({ success: false, message: "Group not found" });
      }
      if (!check.isMember) {
        return res.status(403).json({ success: false, message: "You're not a member of this group" });
      }
      group = check.group;
    }

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
          { quality: "85" },
          { format: "webp" },
          { width: "1280" },
        ],
      });
    }
    let replyToId = null;
    if (reply_to) {
      const original = await Message.findById(reply_to);
      const belongsToThread = group_id
        ? original?.group_id?.toString() === group_id
        : original &&
          ((original.from_user_id === userId && original.to_user_id === to_user_id) ||
            (original.from_user_id === to_user_id && original.to_user_id === userId));
      if (belongsToThread) replyToId = reply_to;
    }

    const message = await Message.create({
      from_user_id: userId,
      to_user_id: group_id ? undefined : to_user_id,
      group_id: group_id || null,
      text,
      message_type,
      media_url,
      reply_to: replyToId,
      delivered: group_id ? true : !!connections[to_user_id],
    });

    const messageWithReply = await Message.findById(message._id).populate(
      "reply_to",
      "text message_type from_user_id media_url",
    );

    res.json({ success: true, message: messageWithReply });

    try {
      const messageWithUserData = await Message.findById(message._id)
        .populate("from_user_id")
        .populate("reply_to", "text message_type from_user_id media_url");

      if (group) {
        group.members
          .filter((m) => m.user_id !== userId)
          .forEach((m) => pushEvent(m.user_id, messageWithUserData));
      } else {
        pushEvent(to_user_id, messageWithUserData);
      }
    } catch (pushError) {
      console.log("Failed to push new message event:", pushError);
    }
  } catch (error) {
    console.log(error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

export const editMessage = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { messageId } = req.params;
    const { text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ success: false, message: "Message can't be empty" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }
    if (message.from_user_id !== userId) {
      return res.status(403).json({ success: false, message: "You can only edit your own messages" });
    }
    if (message.message_type !== "text") {
      return res.status(400).json({ success: false, message: "Only text messages can be edited" });
    }
    if (message.deleted_for_everyone) {
      return res.status(400).json({ success: false, message: "This message was deleted" });
    }
    if (Date.now() - new Date(message.createdAt).getTime() > EDIT_WINDOW_MS) {
      return res.status(400).json({ success: false, message: "Edit window has expired (10 minutes)" });
    }

    message.text = text;
    message.edited = true;
    message.edited_at = new Date();
    await message.save();

    const payload = {
      type: "message-edited",
      messageId: message._id,
      text: message.text,
      edited_at: message.edited_at,
      group_id: message.group_id || undefined,
    };
    if (message.group_id) {
      const check = await checkGroupMembership(message.group_id, userId);
      check.group?.members
        .filter((m) => m.user_id !== userId)
        .forEach((m) => pushEvent(m.user_id, payload));
    } else {
      pushEvent(message.to_user_id, payload);
    }

    res.json({ success: true, message });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteMessageForMe = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }
    let authorized = message.from_user_id === userId || message.to_user_id === userId;
    if (!authorized && message.group_id) {
      const check = await checkGroupMembership(message.group_id, userId);
      authorized = check.isMember;
    }
    if (!authorized) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    await Message.updateOne(
      { _id: messageId },
      { $addToSet: { deleted_for: userId } },
    );

    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteMessageForEveryone = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }
    if (message.from_user_id !== userId) {
      return res.status(403).json({ success: false, message: "You can only delete your own messages for everyone" });
    }
    if (Date.now() - new Date(message.createdAt).getTime() > DELETE_FOR_EVERYONE_WINDOW_MS) {
      return res.status(400).json({ success: false, message: "Delete window has expired (1 hour)" });
    }

    message.deleted_for_everyone = true;
    message.text = "";
    message.media_url = "";
    await message.save();

    const deletePayload = {
      type: "message-deleted",
      messageId: message._id,
      group_id: message.group_id || undefined,
    };
    if (message.group_id) {
      const check = await checkGroupMembership(message.group_id, userId);
      check.group?.members
        .filter((m) => m.user_id !== userId)
        .forEach((m) => pushEvent(m.user_id, deletePayload));
    } else {
      pushEvent(message.to_user_id, deletePayload);
    }

    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const forwardMessage = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { messageId, to_user_ids = [], to_group_ids = [] } = req.body;

    if (to_user_ids.length === 0 && to_group_ids.length === 0) {
      return res.status(400).json({ success: false, message: "Pick at least one recipient" });
    }

    const original = await Message.findById(messageId);
    if (!original || original.deleted_for_everyone) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }
    let authorized = original.from_user_id === userId || original.to_user_id === userId;
    if (!authorized && original.group_id) {
      const check = await checkGroupMembership(original.group_id, userId);
      authorized = check.isMember;
    }
    if (!authorized) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const forwardedType = original.message_type === "call" || original.message_type === "system"
      ? "text"
      : original.message_type;
    let successCount = 0;

    for (const to_user_id of to_user_ids) {
      if (!(await isConnected(userId, to_user_id))) continue; // skip non-connections silently

      const message = await Message.create({
        from_user_id: userId,
        to_user_id,
        text: original.text,
        message_type: forwardedType,
        media_url: original.media_url,
        forwarded: true,
        delivered: !!connections[to_user_id],
      });
      successCount++;

      const populated = await Message.findById(message._id).populate("from_user_id");
      pushEvent(to_user_id, populated);
    }

    for (const to_group_id of to_group_ids) {
      const check = await checkGroupMembership(to_group_id, userId);
      if (!check.isMember) continue; 

      const message = await Message.create({
        from_user_id: userId,
        group_id: to_group_id,
        text: original.text,
        message_type: forwardedType,
        media_url: original.media_url,
        forwarded: true,
        delivered: true,
      });
      successCount++;

      const populated = await Message.findById(message._id).populate("from_user_id");
      check.group.members
        .filter((m) => m.user_id !== userId)
        .forEach((m) => pushEvent(m.user_id, populated));
    }

    if (successCount === 0) {
      return res.status(403).json({ success: false, message: "None of the selected recipients are valid" });
    }

    res.json({ success: true, count: successCount });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getChatMessages = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { to_user_id, group_id } = req.body;

    if (group_id) {
      const check = await checkGroupMembership(group_id, userId);
      if (!check.group) {
        return res.status(404).json({ success: false, message: "Group not found" });
      }
      if (!check.isMember) {
        return res.status(403).json({ success: false, message: "You're not a member of this group" });
      }

      const messages = await Message.find({
        group_id,
        deleted_for: { $ne: userId },
      })
        .populate("from_user_id", "full_name profile_picture username")
        .populate("reply_to", "text message_type from_user_id media_url")
        .sort({ createdAt: -1 });
      return res.json({ success: true, messages });
    }

    const messages = await Message.find({
      $or: [
        { from_user_id: userId, to_user_id },
        { from_user_id: to_user_id, to_user_id: userId },
      ],
      deleted_for: { $ne: userId },
    })
      .populate("reply_to", "text message_type from_user_id media_url")
      .sort({ createdAt: -1 });

    await Message.updateMany(
      { from_user_id: to_user_id, to_user_id: userId },
      { seen: true },
    );

    pushEvent(to_user_id, { type: "seen", by: userId });

    res.json({ success: true, messages });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserRecentMessages = async (req, res) => {
  try {
    const { userId } = req.auth();
    const messages = await Message.find({
      to_user_id: userId,
      deleted_for: { $ne: userId },
    })
      .populate("from_user_id to_user_id")
      .sort({ createdAt: -1 });
    res.json({ success: true, messages });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export { connections, pushEvent };