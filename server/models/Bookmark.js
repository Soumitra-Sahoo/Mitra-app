import mongoose from "mongoose";

const bookmarkSchema = new mongoose.Schema(
  {
    user_id: { type: String, ref: "User", required: true },
    post_id: { type: String, ref: "Post", required: true },
  },
  { timestamps: true },
);

bookmarkSchema.index({ user_id: 1, post_id: 1 }, { unique: true });

const Bookmark = mongoose.model("Bookmark", bookmarkSchema);
export default Bookmark;
