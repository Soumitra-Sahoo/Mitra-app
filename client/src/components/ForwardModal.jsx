import React, { useState } from "react";
import { X, Send, Users } from "lucide-react";
import { useSelector } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios.js";
import toast from "react-hot-toast";

const ForwardModal = ({ message, groups = [], onClose }) => {
  const connections = useSelector((state) => state.connections.connections);
  const { getToken } = useAuth();
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [selectedGroups, setSelectedGroups] = useState(new Set());
  const [sending, setSending] = useState(false);

  const toggle = (set, setSet, id) => {
    setSet((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const totalSelected = selectedUsers.size + selectedGroups.size;

  const handleForward = async () => {
    if (totalSelected === 0) return;
    setSending(true);
    try {
      const token = await getToken();
      const { data } = await api.post(
        "/api/message/forward",
        {
          messageId: message._id,
          to_user_ids: [...selectedUsers],
          to_group_ids: [...selectedGroups],
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (data.success) {
        toast.success(`Forwarded to ${data.count} ${data.count === 1 ? "chat" : "chats"}`);
        onClose();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[350] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card rounded-2xl shadow-2xl w-full max-w-sm max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Forward message</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {groups.length > 0 && (
            <>
              <p className="px-3 py-1.5 text-xs font-medium text-muted uppercase tracking-wide">
                Groups
              </p>
              {groups.map((g) => (
                <label
                  key={g._id}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition"
                >
                  <input
                    type="checkbox"
                    checked={selectedGroups.has(g._id)}
                    onChange={() => toggle(selectedGroups, setSelectedGroups, g._id)}
                    className="size-4 accent-primary"
                  />
                  {g.photo ? (
                    <img src={g.photo} className="size-9 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="size-4 text-primary" />
                    </div>
                  )}
                  <span className="text-sm text-foreground">{g.name}</span>
                </label>
              ))}
            </>
          )}

          <p className="px-3 py-1.5 text-xs font-medium text-muted uppercase tracking-wide">
            Connections
          </p>
          {connections.map((user) => (
            <label
              key={user._id}
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition"
            >
              <input
                type="checkbox"
                checked={selectedUsers.has(user._id)}
                onChange={() => toggle(selectedUsers, setSelectedUsers, user._id)}
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
            onClick={handleForward}
            disabled={totalSelected === 0 || sending}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-gradient-start to-gradient-end hover:brightness-110 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="size-4" />
            {sending ? "Sending…" : `Send${totalSelected > 0 ? ` (${totalSelected})` : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForwardModal;