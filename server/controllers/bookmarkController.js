import Bookmark from "../models/Bookmark.js";
import Post from "../models/Post.js";
import { canViewPost } from "../utils/postVisibility.js";

export const toggleBookmark = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { postId } = req.body;
    const post = await Post.findById(postId).populate("user");
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }
    if (!canViewPost(post, userId)) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to view this post",
      });
    }

    const existing = await Bookmark.findOne({
      user_id: userId,
      post_id: postId,
    });
    if (existing) {
      await Bookmark.deleteOne({ _id: existing._id });
      return res.json({ success: true, bookmarked: false });
    }

    await Bookmark.create({ user_id: userId, post_id: postId });
    res.json({ success: true, bookmarked: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBookmarks = async (req, res) => {
  try {
    const { userId } = req.auth();
    const bookmarks = await Bookmark.find({ user_id: userId }).sort({ createdAt: -1 });
    const postIds = bookmarks.map((b) => b.post_id);

    const posts = await Post.find({ _id: { $in: postIds } }).populate("user");
    const postMap = Object.fromEntries(posts.map((p) => [p._id.toString(), p]));
    const orderedPosts = postIds.map((id) => postMap[id]).filter(Boolean);
    const visiblePosts = orderedPosts.filter((post) => canViewPost(post, userId));
    res.json({ success: true, posts: visiblePosts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBookmarkedPostIds = async (req, res) => {
  try {
    const { userId } = req.auth();
    const bookmarks = await Bookmark.find({ user_id: userId }).select(
      "post_id",
    );
    res.json({ success: true, postIds: bookmarks.map((b) => b.post_id) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
