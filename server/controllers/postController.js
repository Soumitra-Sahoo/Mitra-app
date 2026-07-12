import fs from "fs";
import imagekit from "../configs/imageKit.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import Comment from "../models/Comment.js";

const addPost = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { content, post_type } = req.body;
    const images = req.files;

    let image_urls = [];

    if (images && images.length) {
      image_urls = await Promise.all(
        images.map(async (image) => {
          const fileBuffer = fs.readFileSync(image.path);

          const response = await imagekit.upload({
            file: fileBuffer,
            fileName: image.originalname,
            folder: "posts",
          });

          const url = imagekit.url({
            path: response.filePath,
            transformation: [
              { quality: "auto" },
              { format: "webp" },
              { width: "1280" },
            ],
          });

          fs.unlink(image.path, () => {});

          return url;
        }),
      );
    }

    await Post.create({
      user: userId,
      content,
      image_urls,
      post_type,
    });

    res.json({
      success: true,
      message: "Post created successfully",
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

const getFeedPosts = async (req, res) => {
  try {
    const { userId } = req.auth();

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 30);
    const skip = (page - 1) * limit;

    const user = await User.findById(userId);
    const userIds = [userId, ...user.connections, ...user.following];
    const filter = {
      user: {
        $in: userIds,
      },
    };

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate("user")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Post.countDocuments(filter),
    ]);

    res.json({
      success: true,
      posts,
      page,
      hasMore: skip + posts.length < total,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

const likePost = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { postId } = req.body;

    const post = await Post.findById(postId);

    if (!post) {
      return res.json({
        success: false,
        message: "Post not found",
      });
    }

    const isLiked = post.likes_count.includes(userId);

    if (isLiked) {
      await Post.updateOne(
        { _id: postId },
        { $pull: { likes_count: userId } },
      );

      await Notification.deleteOne({
        sender_id: userId,
        post_id: postId,
        type: "like",
      });

      return res.json({
        success: true,
        message: "Post unliked",
      });
    }

    await Post.updateOne(
      { _id: postId },
      { $addToSet: { likes_count: userId } },
    );

    if (post.user !== userId) {
      const sender = await User.findById(userId);

      await Notification.create({
        recipient_id: post.user,
        sender_id: userId,
        type: "like",
        post_id: postId,
        message: `${sender.full_name} liked your post`,
      });
    }

    res.json({
      success: true,
      message: "Post liked",
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

const deletePost = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { postId } = req.params;

    const post = await Post.findById(postId);

    if (!post) {
      return res.json({
        success: false,
        message: "Post not found",
      });
    }

    if (post.user !== userId) {
      return res.json({
        success: false,
        message: "You can only delete your own posts",
      });
    }

    await Post.deleteOne({ _id: postId });
    await Comment.deleteMany({ post_id: postId });
    await Notification.deleteMany({ post_id: postId });

    res.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

const getPostsByHashtag = async (req, res) => {
  try {
    const { tag } = req.params;

    const posts = await Post.find({
      content: {
        $regex: `#${tag}`,
        $options: "i",
      },
    })
      .populate("user")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      posts,
      tag,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

const getTrendingHashtags = async (req, res) => {
  try {
    const posts = await Post.find({
      content: {
        $exists: true,
        $ne: "",
      },
    })
      .select("content")
      .limit(500);

    const tagCount = {};
    const regex = /#(\w+)/g;

    posts.forEach((post) => {
      const matches = post.content?.matchAll(regex) || [];

      for (const match of matches) {
        const tag = match[1].toLowerCase();
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      }
    });

    const trending = Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({
        tag,
        count,
      }));

    res.json({
      success: true,
      trending,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

export {
  addPost,
  getFeedPosts,
  likePost,
  deletePost,
  getPostsByHashtag,
  getTrendingHashtags,
};