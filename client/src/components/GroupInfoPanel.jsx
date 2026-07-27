import React, { useEffect, useState } from "react";
import { X, Crown, UserPlus, UserMinus, LogOut, Pencil, Check, Users } from "lucide-react";
import { useSelector } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import toast from "react-hot-toast";

const MAX_GROUP_MEMBERS = 20;

const GroupInfoPanel = ({ groupId, onClose, onUpdated }) => {
  const currentUser = useSelector((state) => state.user.value);
  const connections = useSelector((state) => state.connections.connections);
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [showAddPicker, setShowAddPicker] = useState(false);

  const fetchGroup = async () => {
    try {
      const token = await getToken();
      const { data } = await api.get(`/api/group/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setGroup(data.group);
        setNameInput(data.group.name);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroup();
  }, [groupId]);

  const myMembership = group?.members.find((m) => m.user_id === currentUser?._id);
  const isAdmin = myMembership?.role === "admin";

  const handleRename = async () => {
    if (!nameInput.trim() || nameInput.trim() === group.name) {
      setEditingName(false);
      return;
    }
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("name", nameInput.trim());
      const { data } = await api.put(`/api/group/${groupId}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setGroup(data.group);
        onUpdated?.();
        toast.success("Group renamed");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setEditingName(false);
    }
  };

  const handleAddMember = async (userId) => {
    try {
      const token = await getToken();
      const { data } = await api.post(
        `/api/group/${groupId}/members`,
        { member_id: userId },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (data.success) {
        setGroup(data.group);
        onUpdated?.();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      const token = await getToken();
      const { data } = await api.delete(`/api/group/${groupId}/members/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setGroup(data.group);
        onUpdated?.();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      const token = await getToken();
      const { data } = await api.put(
        `/api/group/${groupId}/members/${userId}/role`,
        { role },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (data.success) {
        setGroup(data.group);
        onUpdated?.();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleLeave = async () => {
    if (!window.confirm("Leave this group?")) return;
    try {
      const token = await getToken();
      const { data } = await api.post(
        `/api/group/${groupId}/leave`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (data.success) {
        toast.success("Left the group");
        onClose();
        navigate("/messages");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) return null;
  if (!group) return null;

  const memberIds = new Set(group.members.map((m) => m.user_id));
  const addableConnections = connections.filter((c) => !memberIds.has(c._id));

  return (
    <div className="fixed inset-0 z-[350] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card rounded-2xl shadow-2xl w-full max-w-sm max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Group info</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition">
            <X className="size-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center border-b border-border">
          {group.photo ? (
            <img src={group.photo} className="size-20 rounded-full object-cover" alt="" />
          ) : (
            <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="size-8 text-primary" />
            </div>
          )}

          {editingName ? (
            <div className="flex items-center gap-2 mt-3">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRename()}
                autoFocus
                className="border border-border bg-card text-foreground rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
              <button onClick={handleRename} className="text-primary">
                <Check className="size-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="flex items-center gap-2 mt-3 text-lg font-semibold text-foreground"
            >
              {group.name}
              <Pencil className="size-3.5 text-muted" />
            </button>
          )}
          <p className="text-xs text-muted mt-1">
            {group.members.length} members
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <button
            onClick={() => setShowAddPicker((v) => !v)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-primary transition"
          >
            <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center">
              <UserPlus className="size-4" />
            </div>
            <span className="text-sm font-medium">Add member</span>
          </button>

          {showAddPicker && (
            <div className="ml-3 mb-2 border-l-2 border-border pl-3">
              {addableConnections.length === 0 && (
                <p className="text-xs text-muted py-2">
                  All your connections are already in this group
                </p>
              )}
              {addableConnections.map((c) => (
                <button
                  key={c._id}
                  onClick={() => handleAddMember(c._id)}
                  disabled={group.members.length >= MAX_GROUP_MEMBERS}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50"
                >
                  <img src={c.profile_picture} className="size-7 rounded-full object-cover" alt="" />
                  <span className="text-sm text-foreground">{c.full_name}</span>
                </button>
              ))}
            </div>
          )}

          {group.members.map((m) => (
            <div
              key={m.user_id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              <img src={m.user?.profile_picture} className="size-9 rounded-full object-cover" alt="" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate flex items-center gap-1">
                  {m.user?.full_name}
                  {m.role === "admin" && <Crown className="size-3.5 text-amber-500" />}
                  {m.user_id === currentUser?._id && (
                    <span className="text-xs text-muted">(You)</span>
                  )}
                </p>
                <p className="text-xs text-muted">
                  {m.role === "admin" ? "Admin" : "Member"}
                </p>
              </div>

              {isAdmin && m.user_id !== currentUser?._id && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      handleRoleChange(m.user_id, m.role === "admin" ? "member" : "admin")
                    }
                    title={m.role === "admin" ? "Remove as admin" : "Make admin"}
                    className="p-1.5 rounded-lg text-muted hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition"
                  >
                    <Crown className="size-4" />
                  </button>
                  <button
                    onClick={() => handleRemoveMember(m.user_id)}
                    title="Remove from group"
                    className="p-1.5 rounded-lg text-muted hover:text-rose hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                  >
                    <UserMinus className="size-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-border">
          <button
            onClick={handleLeave}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 text-red-500 font-medium transition"
          >
            <LogOut className="size-4" />
            Leave group
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupInfoPanel;