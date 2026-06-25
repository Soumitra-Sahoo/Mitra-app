import Comment from "../models/Comment.js";
import Post from "../models/Post.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

// Add comment (or reply when parent_id is provided)
export const addComment = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { post_id, text, parent_id } = req.body;

    if (!text?.trim())
      return res.json({ success: false, message: "Comment cannot be empty" });

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
    const post = await Post.findById(post_id);
    if (post && post.user !== userId) {
      const sender = await User.findById(userId);
      await Notification.create({
        recipient_id: post.user,
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
    res.json({ success: false, message: error.message });
  }
};

export const getComments = async (req, res) => {
  try {
    const { post_id } = req.params;

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
    res.json({ success: false, message: error.message });
  }
};

// Delete comment
export const deleteComment = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { comment_id } = req.params;

    const comment = await Comment.findById(comment_id);
    if (!comment)
      return res.json({ success: false, message: "Comment not found" });
    if (comment.user_id !== userId)
      return res.json({ success: false, message: "Unauthorized" });

    // Delete comment and all its replies
    await Comment.deleteMany({ _id: comment_id });
    await Comment.deleteMany({ parent_id: comment_id });

    res.json({ success: true, message: "Comment deleted" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Like / unlike a comment
export const likeComment = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { comment_id } = req.params;

    const comment = await Comment.findById(comment_id);
    if (!comment)
      return res.json({ success: false, message: "Comment not found" });

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
    res.json({ success: false, message: error.message });
  }
};

// Get comment count for a post
export const getCommentCount = async (req, res) => {
  try {
    const { post_id } = req.params;
    const count = await Comment.countDocuments({ post_id });
    res.json({ success: true, count });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
