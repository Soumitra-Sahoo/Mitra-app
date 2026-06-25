import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient_id: { type: String, ref: "User", required: true },
    sender_id: { type: String, ref: "User", required: true },
    type: {
      type: String,
      enum: [
        "like",
        "comment",
        "follow",
        "connection_request",
        "connection_accepted",
        "reply",
      ],
      required: true,
    },
    post_id: { type: String, ref: "Post", default: null },
    comment_id: { type: String, ref: "Comment", default: null },
    read: { type: Boolean, default: false },
    message: { type: String }, 
  },
  { timestamps: true },
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
