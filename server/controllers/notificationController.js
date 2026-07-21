import Notification from "../models/Notification.js";

export const getNotifications = async (req, res) => {
  try {
    const { userId } = req.auth();

    const notifications = await Notification.find({ recipient_id: userId })
      .populate("sender_id", "full_name profile_picture username")
      .populate("post_id", "content image_urls")
      .populate("comment_id", "text")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, notifications });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAllRead = async (req, res) => {
  try {
    const { userId } = req.auth();
    await Notification.updateMany(
      { recipient_id: userId, read: false },
      { read: true },
    );
    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markOneRead = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.params;
    const result = await Notification.findOneAndUpdate(
      { _id: id, recipient_id: userId },
      { read: true },
    );
    if (!result) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.auth();
    const count = await Notification.countDocuments({
      recipient_id: userId,
      read: false,
    });
    res.json({ success: true, count });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};