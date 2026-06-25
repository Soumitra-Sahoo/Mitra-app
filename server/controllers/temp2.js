import Notification from "../models/Notification.js";

// Get all notifications for the logged-in user
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
    res.json({ success: false, message: error.message });
  }
};

// Mark all notifications as read
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
    res.json({ success: false, message: error.message });
  }
};

// Mark single notification as read
export const markOneRead = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { read: true });
    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Get unread count (for badge)
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
    res.json({ success: false, message: error.message });
  }
};
