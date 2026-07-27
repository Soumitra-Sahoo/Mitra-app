import Group, { MAX_GROUP_MEMBERS } from "../models/Group.js";
import User from "../models/User.js";
import Message from "../models/Message.js";
import imagekit from "../configs/imageKit.js";
import { isConnected } from "../utils/isConnected.js";
import { pushEvent } from "./messageController.js";

const announceAndBroadcast = async (group, text) => {
  const message = await Message.create({
    from_user_id: group.created_by, 
    group_id: group._id,
    text,
    message_type: "system",
  });
  const memberIds = group.members.map((m) => m.user_id);
  memberIds.forEach((id) => {
    pushEvent(id, { type: "group-updated", group_id: group._id.toString() });
    pushEvent(id, { ...message.toObject(), type: "group-message" });
  });
};

const isMember = (group, userId) =>
  group.members.some((m) => m.user_id === userId);

const isAdmin = (group, userId) =>
  group.members.some((m) => m.user_id === userId && m.role === "admin");

const adminCount = (group) =>
  group.members.filter((m) => m.role === "admin").length;
const autoPromoteIfNeeded = (group, excludingUserId) => {
  if (adminCount(group) > 0) return;
  const remaining = group.members.filter((m) => m.user_id !== excludingUserId);
  if (remaining.length === 0) return;
  const senior = [...remaining].sort((a, b) => a.joined_at - b.joined_at)[0];
  const target = group.members.find((m) => m.user_id === senior.user_id);
  if (target) target.role = "admin";
};

export const createGroup = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { name, member_ids } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: "Group name is required" });
    }
    const initialIds = Array.isArray(member_ids) ? [...new Set(member_ids)] : [];
    if (initialIds.length === 0) {
      return res.status(400).json({ success: false, message: "Add at least one member" });
    }
    if (initialIds.length + 1 > MAX_GROUP_MEMBERS) {
      return res.status(400).json({
        success: false,
        message: `Groups are capped at ${MAX_GROUP_MEMBERS} members`,
      });
    }
    for (const id of initialIds) {
      if (!(await isConnected(userId, id))) {
        return res.status(403).json({
          success: false,
          message: "You can only add your connections to a group",
        });
      }
    }

    const creator = await User.findById(userId);
    const members = [
      { user_id: userId, role: "admin" },
      ...initialIds.map((id) => ({ user_id: id, role: "member" })),
    ];

    const group = await Group.create({ name: name.trim(), created_by: userId, members });
    await announceAndBroadcast(group, `${creator.full_name} created the group "${group.name}"`);

    res.json({ success: true, group });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addMember = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { groupId } = req.params;
    const { member_id } = req.body;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });
    if (!isMember(group, userId)) {
      return res.status(403).json({ success: false, message: "You're not a member of this group" });
    }
    if (isMember(group, member_id)) {
      return res.status(409).json({ success: false, message: "Already a member" });
    }
    if (group.members.length + 1 > MAX_GROUP_MEMBERS) {
      return res.status(400).json({
        success: false,
        message: `Groups are capped at ${MAX_GROUP_MEMBERS} members`,
      });
    }
    if (!(await isConnected(userId, member_id))) {
      return res.status(403).json({
        success: false,
        message: "You can only add your connections to a group",
      });
    }

    const [adder, added] = await Promise.all([
      User.findById(userId),
      User.findById(member_id),
    ]);
    group.members.push({ user_id: member_id, role: "member" });
    await group.save();

    await announceAndBroadcast(group, `${adder.full_name} added ${added.full_name}`);

    res.json({ success: true, group });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeMember = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { groupId, memberId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });
    if (!isAdmin(group, userId)) {
      return res.status(403).json({ success: false, message: "Only admins can remove members" });
    }
    if (!isMember(group, memberId)) {
      return res.status(404).json({ success: false, message: "That user isn't a member" });
    }
    if (memberId === userId) {
      return res.status(400).json({ success: false, message: "Use 'leave group' to remove yourself" });
    }

    const [remover, removed] = await Promise.all([
      User.findById(userId),
      User.findById(memberId),
    ]);
    group.members = group.members.filter((m) => m.user_id !== memberId);
    autoPromoteIfNeeded(group, memberId);
    await group.save();

    await announceAndBroadcast(group, `${remover.full_name} removed ${removed.full_name}`);
    pushEvent(memberId, { type: "group-updated", group_id: group._id.toString(), removed: true });

    res.json({ success: true, group });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const leaveGroup = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });
    if (!isMember(group, userId)) {
      return res.status(403).json({ success: false, message: "You're not a member of this group" });
    }

    const leaver = await User.findById(userId);
    group.members = group.members.filter((m) => m.user_id !== userId);
    autoPromoteIfNeeded(group, userId);
    await group.save();

    if (group.members.length > 0) {
      await announceAndBroadcast(group, `${leaver.full_name} left the group`);
    }

    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const setAdminRole = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { groupId, memberId } = req.params;
    const { role } = req.body; 

    if (!["admin", "member"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });
    if (!isAdmin(group, userId)) {
      return res.status(403).json({ success: false, message: "Only admins can change roles" });
    }
    const target = group.members.find((m) => m.user_id === memberId);
    if (!target) return res.status(404).json({ success: false, message: "That user isn't a member" });

    if (role === "member" && target.role === "admin" && adminCount(group) === 1) {
      return res.status(400).json({
        success: false,
        message: "A group must always have at least one admin",
      });
    }

    target.role = role;
    await group.save();

    const [actor, changed] = await Promise.all([
      User.findById(userId),
      User.findById(memberId),
    ]);
    await announceAndBroadcast(
      group,
      role === "admin"
        ? `${actor.full_name} made ${changed.full_name} an admin`
        : `${actor.full_name} removed ${changed.full_name} as admin`,
    );

    res.json({ success: true, group });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateGroupInfo = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { groupId } = req.params;
    const { name } = req.body;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });
    if (!isMember(group, userId)) {
      return res.status(403).json({ success: false, message: "You're not a member of this group" });
    }

    const actor = await User.findById(userId);
    const notices = [];

    if (name?.trim() && name.trim() !== group.name) {
      notices.push(`${actor.full_name} changed the group name to "${name.trim()}"`);
      group.name = name.trim();
    }
    if (req.file) {
      const response = await imagekit.upload({
        file: req.file.buffer,
        fileName: req.file.originalname,
      });
      group.photo = imagekit.url({
        path: response.filePath,
        transformation: [{ quality: "85" }, { format: "webp" }, { width: "512" }],
      });
      notices.push(`${actor.full_name} changed the group photo`);
    }

    if (notices.length === 0) {
      return res.status(400).json({ success: false, message: "Nothing to update" });
    }

    await group.save();
    for (const notice of notices) {
      await announceAndBroadcast(group, notice);
    }

    res.json({ success: true, group });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getGroupInfo = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });
    if (!isMember(group, userId)) {
      return res.status(403).json({ success: false, message: "You're not a member of this group" });
    }

    const users = await User.find(
      { _id: { $in: group.members.map((m) => m.user_id) } },
      "full_name username profile_picture",
    );
    const userMap = Object.fromEntries(users.map((u) => [u._id, u]));
    const members = group.members
      .map((m) => ({
        ...m.toObject(),
        user: userMap[m.user_id] || null,
      }))
      .sort((a, b) => {
        if (a.role !== b.role) return a.role === "admin" ? -1 : 1;
        return new Date(a.joined_at) - new Date(b.joined_at);
      });

    res.json({ success: true, group: { ...group.toObject(), members } });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserGroups = async (req, res) => {
  try {
    const { userId } = req.auth();
    const groups = await Group.find({ "members.user_id": userId }).sort({ updatedAt: -1 });
    res.json({ success: true, groups });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const checkGroupMembership = async (groupId, userId) => {
  const group = await Group.findById(groupId);
  if (!group) return { group: null, isMember: false };
  return { group, isMember: isMember(group, userId) };
};
