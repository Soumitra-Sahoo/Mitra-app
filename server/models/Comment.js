import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    post_id: { type: String, ref: "Post", required: true },
    user_id: { type: String, ref: "User", required: true },
    parent_id: { type: String, ref: "Comment", default: null }, // null = top-level
    text: { type: String, required: true, trim: true },
    likes: [{ type: String, ref: "User" }],
  },
  { timestamps: true },
);

const Comment = mongoose.model("Comment", commentSchema);
export default Comment;
