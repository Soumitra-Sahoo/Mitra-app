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
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBookmarks = async (req, res) => {
  try {
    const { userId } = req.auth();
    const bookmarks = await Bookmark.find({ user_id: userId }).sort({
      createdAt: -1,
    });

    const posts = await Promise.all(
      bookmarks.map(async (b) => {
        const post = await Post.findById(b.post_id).populate("user");
        return post;
      }),
    );

    const visiblePosts = posts.filter(
      (post) => post && canViewPost(post, userId),
    );

    res.json({ success: true, posts: visiblePosts });
  } catch (error) {
    console.log(error);
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
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
