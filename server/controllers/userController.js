import imagekit from "../configs/imageKit.js";
import Connection from "../models/Connection.js";
import User from "../models/User.js";
import Post from "../models/Post.js";
import { inngest } from "../inngest/index.js";
import Notification from "../models/Notification.js";
import { canViewPost } from "../utils/postVisibility.js";

const getUserData = async (req, res) => {
  try {
    const { userId } = req.auth();
    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateUserData = async (req, res) => {
  try {
    const { userId } = req.auth();
    let { username, bio, location, full_name } = req.body;
    const tempUser = await User.findById(userId);
    !username && (username = tempUser.username);
    if (tempUser.username !== username) {
      const user = await User.findOne({ username });

      if (user) {
        username = tempUser.username;
      }
    }

    const updatedData = {username, bio, location, full_name};

    const profile = req.files.profile && req.files.profile[0];
    const cover = req.files.cover && req.files.cover[0];

    if (profile) {
      const response = await imagekit.upload({
        file: profile.buffer,
        fileName: profile.originalname,
      });

      const url = imagekit.url({
        path: response.filePath,
        transformation: [
          // See postController.js addPost for why this isn't "auto".
          { quality: "85" },
          { format: "webp" },
          { width: "512" },
        ],
      });

      updatedData.profile_picture = url;
    }

    if (cover) {
      const response = await imagekit.upload({
        file: cover.buffer,
        fileName: cover.originalname,
      });

      const url = imagekit.url({
        path: response.filePath,
        transformation: [
          { quality: "85" },
          { format: "webp" },
          { width: "1280" },
        ],
      });

      updatedData.cover_photo = url;
    }

    const user = await User.findByIdAndUpdate(userId, updatedData, {
      new: true,
    });

    res.json({ success: true, user, message: "Profile updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const discoverUsers = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { input } = req.body;
    let users;
    if (!input) {
      users = await User.find({
        _id: { $ne: userId },
      }).limit(6);
    } else {
      users = await User.find({
        _id: { $ne: userId },

        $or: [
          { username: new RegExp(input, "i") },
          { email: new RegExp(input, "i") },
          { full_name: new RegExp(input, "i") },
          { location: new RegExp(input, "i") },
        ],
      });
    }

    res.json({success: true, users});
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const followUser = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;
    const user = await User.findById(userId);
    if (user.following.includes(id)) {
      return res.status(409).json({
        success: false,
        message: "You are already following this user",
      });
    }

    await User.updateOne(
      { _id: userId },
      { $addToSet: { following: id } },
    );

    await User.updateOne(
      { _id: id },
      { $addToSet: { followers: userId } },
    );

    await Notification.create({
      recipient_id: id,
      sender_id: userId,
      type: "follow",
      message: `${user.full_name} started following you`,
    });

    res.json({
      success: true,
      message: "Now you are following this user",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const unfollowUser = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;

    await User.updateOne(
      { _id: userId },
      { $pull: { following: id } },
    );

    await User.updateOne(
      { _id: id },
      { $pull: { followers: userId } },
    );

    res.json({
      success: true,
      message: "You are no longer following this user",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const sendConnectionReqest = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const connectionRequests = await Connection.find({
      from_user_id: userId,
      createdAt: { $gt: last24Hours },
    });
    if (connectionRequests.length >= 20) {
      return res.status(429).json({
        success: false,
        message:
          "You have sent more than 20 connection requests in the last 24 hours",
      });
    }

    const connection = await Connection.findOne({
      $or: [
        { from_user_id: userId, to_user_id: id },
        { from_user_id: id, to_user_id: userId },
      ],
    });

    if (!connection) {
      const newConnection = await Connection.create({
        from_user_id: userId,
        to_user_id: id,
      });

      await inngest.send({
        name: "app/connection-request",
        data: { connectionId: newConnection._id },
      });

      return res.json({
        success: true,
        message: "Connection request sent successfully",
      });
    } else if (connection && connection.status === "accepted") {
      return res.status(409).json({
        success: false,
        message: "You are already connected with this user",
      });
    }

    return res.status(409).json({ success: false, message: "Connection request pending" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUserConnections = async (req, res) => {
  try {
    const { userId } = req.auth();
    const user = await User.findById(userId).populate(
      "connections followers following",
    );

    const connections = user.connections;
    const followers = user.followers;
    const following = user.following;

    const pendingConnections = (
      await Connection.find({ to_user_id: userId, status: "pending" }).populate(
        "from_user_id",
      )
    ).map((connection) => connection.from_user_id);

    res.json({
      success: true,
      connections,
      followers,
      following,
      pendingConnections,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const acceptConnectionRequest = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;

    const connection = await Connection.findOne({
      from_user_id: id,
      to_user_id: userId,
    });

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Connection not found",
      });
    }

    await User.updateOne(
      { _id: userId },
      { $addToSet: { connections: id } },
    );

    await User.updateOne(
      { _id: id },
      { $addToSet: { connections: userId } },
    );

    connection.status = "accepted";
    await connection.save();

    const accepter = await User.findById(userId);

    await Notification.create({
      recipient_id: id,
      sender_id: userId,
      type: "connection_accepted",
      message: `${accepter.full_name} accepted your connection request`,
    });

    res.json({
      success: true,
      message: "Connection accepted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getUserProfiles = async (req, res) => {
  try {
    const { userId: viewerId } = req.auth();
    const { profileId } = req.body;
    const profile = await User.findById(profileId).select("-email");
    if (!profile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }
    const posts = await Post.find({ user: profileId }).populate(
      "user",
      "-email",
    );
    const visiblePosts = posts.filter((post) => canViewPost(post, viewerId));
    res.json({ success: true, profile, posts: visiblePosts });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPeopleYouMayKnow = async (req, res) => {
  try {
    const { userId } = req.auth();
    const me = await User.findById(userId);
    const exclude = new Set([
      userId,
      ...me.following.map(String),
      ...me.connections.map(String),
    ]);
    const followedUsers = await User.find({
      _id: { $in: me.following },
    }).select("following connections");

    const mutualPool = new Set();
    followedUsers.forEach((followed) => {
      [...followed.following, ...followed.connections].forEach((id) => {
        const s = String(id);
        if (!exclude.has(s)) mutualPool.add(s);
      });
    });

    let suggestions = [];
    if (mutualPool.size > 0) {
      suggestions = await User.find({ _id: { $in: [...mutualPool] } }).limit(6);
    }
    if (suggestions.length < 6) {
      const extraIds = [
        ...exclude,
        ...suggestions.map((u) => u._id.toString()),
      ];
      const extra = await User.find({ _id: { $nin: extraIds } })
        .sort({ followers: -1 })
        .limit(6 - suggestions.length);
      suggestions = [...suggestions, ...extra];
    }

    res.json({ success: true, users: suggestions });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getOnboardingStatus = async (req, res) => {
  try {
    const { userId } = req.auth();
    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const needsOnboarding =
      !user.bio ||
      user.bio === "Hey there! I am using Mitra App" ||
      !user.location ||
      !user.profile_picture;

    res.json({ success: true, needsOnboarding, user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export {
  getUserData,
  updateUserData,
  discoverUsers,
  followUser,
  unfollowUser,
  sendConnectionReqest,
  getUserConnections,
  acceptConnectionRequest,
  getUserProfiles,
  getPeopleYouMayKnow,
  getOnboardingStatus,
};