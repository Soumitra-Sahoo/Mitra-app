import Comment from "../models/Comment.js";
import Post from "../models/Post.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { canViewPost } from "../utils/postVisibility.js";

export const addComment = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { post_id, text, parent_id } = req.body;

    if (!text?.trim())
      return res.status(400).json({ success: false, message: "Comment cannot be empty" });

    const post = await Post.findById(post_id).populate("user");
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }
    if (!canViewPost(post, userId)) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to comment on this post",
      });
    }

    const comment = await Comment.create({
      post_id,
      user_id: userId,
      text,
      parent_id: parent_id || null,
    });
    const populated = await Comment.findById(comment._id).populate(
      "user_id",
      "full_name profile_picture username",
    );
    if (post.user._id !== userId) {
      const sender = await User.findById(userId);
      await Notification.create({
        recipient_id: post.user._id,
        sender_id: userId,
        type: parent_id ? "reply" : "comment",
        post_id,
        comment_id: comment._id,
        message: `${sender.full_name} ${parent_id ? "replied to a comment on" : "commented on"} your post`,
      });
    }

    res.json({ success: true, comment: populated });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getComments = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { post_id } = req.params;

    const post = await Post.findById(post_id).populate("user");
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }
    if (!canViewPost(post, userId)) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to view this post's comments",
      });
    }

    const topLevel = await Comment.find({ post_id, parent_id: null })
      .populate("user_id", "full_name profile_picture username")
      .sort({ createdAt: -1 });
    const withReplies = await Promise.all(
      topLevel.map(async (comment) => {
        const replies = await Comment.find({
          post_id,
          parent_id: comment._id.toString(),
        })
          .populate("user_id", "full_name profile_picture username")
          .sort({ createdAt: 1 });
        return { ...comment.toObject(), replies };
      }),
    );

    res.json({ success: true, comments: withReplies });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { comment_id } = req.params;

    const comment = await Comment.findById(comment_id);
    if (!comment)
      return res.status(404).json({ success: false, message: "Comment not found" });
    if (comment.user_id !== userId)
      return res.status(403).json({ success: false, message: "Unauthorized" });

    await Comment.deleteMany({ _id: comment_id });
    await Comment.deleteMany({ parent_id: comment_id });

    res.json({ success: true, message: "Comment deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const likeComment = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { comment_id } = req.params;

    const comment = await Comment.findById(comment_id);
    if (!comment)
      return res.status(404).json({ success: false, message: "Comment not found" });

    const post = await Post.findById(comment.post_id).populate("user");
    if (!post || !canViewPost(post, userId)) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to interact with this comment",
      });
    }

    const liked = comment.likes.includes(userId);
    if (liked) {
      comment.likes = comment.likes.filter((id) => id !== userId);
    } else {
      comment.likes.push(userId);
    }
    await comment.save();

    res.json({
      success: true,
      liked: !liked,
      likesCount: comment.likes.length,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCommentCount = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { post_id } = req.params;

    const post = await Post.findById(post_id).populate("user");
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }
    if (!canViewPost(post, userId)) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to view this post",
      });
    }

    const count = await Comment.countDocuments({ post_id });
    res.json({ success: true, count });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};