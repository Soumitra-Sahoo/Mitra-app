import React, { useState } from "react";
import { X, Users } from "lucide-react";
import { useSelector } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import toast from "react-hot-toast";

const MAX_GROUP_MEMBERS = 20;

const CreateGroupModal = ({ onClose }) => {
  const connections = useSelector((state) => state.connections.connections);
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [creating, setCreating] = useState(false);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size + 1 < MAX_GROUP_MEMBERS) {
        next.add(id);
      } else {
        toast.error(`Groups are capped at ${MAX_GROUP_MEMBERS} members`);
      }
      return next;
    });
  };

  const handleCreate = async () => {
    if (!name.trim()) return toast.error("Enter a group name");
    if (selected.size === 0) return toast.error("Add at least one member");
    setCreating(true);
    try {
      const token = await getToken();
      const { data } = await api.post(
        "/api/group/create",
        { name: name.trim(), member_ids: [...selected] },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (data.success) {
        toast.success("Group created");
        onClose();
        navigate(`/messages/group/${data.group._id}`);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[350] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card rounded-2xl shadow-2xl w-full max-w-sm max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold text-foreground">New group</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition">
            <X className="size-5" />
          </button>
        </div>

        <div className="p-4 border-b border-border">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Group name"
            className="w-full border border-border bg-card text-foreground rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-muted mt-2">
            {selected.size} / {MAX_GROUP_MEMBERS - 1} members selected
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {connections.length === 0 && (
            <p className="text-center text-sm text-muted py-8">
              Connect with people first to add them to a group
            </p>
          )}
          {connections.map((user) => (
            <label
              key={user._id}
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition"
            >
              <input
                type="checkbox"
                checked={selected.has(user._id)}
                onChange={() => toggle(user._id)}
                className="size-4 accent-primary"
              />
              <img src={user.profile_picture} className="size-9 rounded-full object-cover" alt="" />
              <div>
                <p className="text-sm font-medium text-foreground">{user.full_name}</p>
                <p className="text-xs text-muted">@{user.username}</p>
              </div>
            </label>
          ))}
        </div>

        <div className="p-4 border-t border-border">
          <button
            onClick={handleCreate}
            disabled={creating}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-gradient-start to-gradient-end hover:brightness-110 text-white font-medium transition disabled:opacity-50"
          >
            <Users className="size-4" />
            {creating ? "Creating…" : "Create group"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;