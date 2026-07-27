import React, { useEffect, useState } from "react";
import { Eye, MessageSquare, MessageSquareText, Users, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios.js";
import { useOnline } from "../App.jsx";
import CreateGroupModal from "../components/CreateGroupModal.jsx";

const Message = () => {
  const { connections } = useSelector((state) => state.connections);
  const { onlineUsers, groupEventTick } = useOnline();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const fetchGroups = async () => {
    try {
      const token = await getToken();
      const { data } = await api.get("/api/group", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) setGroups(data.groups);
    } catch (_) {}
  };

  useEffect(() => {
    fetchGroups();
  }, [groupEventTick]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold text-foreground mb-2">
              <MessageSquareText className="size-7 shrink-0" />
              <span>Messages</span>
            </h1>
            <p className="text-foreground-secondary">Talk to your friends and family</p>
          </div>
          <button
            onClick={() => setShowCreateGroup(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-gradient-start to-gradient-end hover:brightness-110 text-white font-medium transition"
          >
            <Plus className="size-4" />
            New group
          </button>
        </div>

        {groups.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wide mb-3">
              Groups
            </h2>
            <div className="flex flex-col gap-3">
              {groups.map((g) => (
                <div
                  key={g._id}
                  onClick={() => navigate(`/messages/group/${g._id}`)}
                  className="max-w-xl flex items-center gap-4 p-5 bg-card shadow-sm rounded-2xl border border-border hover:shadow-md transition-all cursor-pointer"
                >
                  {g.photo ? (
                    <img src={g.photo} className="size-12 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="size-5 text-primary" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{g.name}</p>
                    <p className="text-muted text-sm">
                      {g.members.length} members
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <h2 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wide mb-3">
          Direct Messages
        </h2>
        <div className="flex flex-col gap-3">
          {connections.length === 0 && (
            <p className="text-muted text-center mt-16">
              No connections yet. Connect with people to start messaging!
            </p>
          )}
          {connections.map((user) => {
            const online = onlineUsers.has(user._id);
            return (
              <div
                key={user._id}
                className="max-w-xl flex flex-wrap gap-4 p-5 bg-card shadow-sm rounded-2xl border border-border hover:shadow-md transition-all"
              >
                <div className="relative self-start">
                  <img
                    src={user.profile_picture}
                    className="aspect-square object-cover rounded-full size-12"
                    alt=""
                  />
                  {online && (
                    <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>

                <div className="flex-1">
                  <p className="font-semibold text-foreground">
                    {user.full_name}
                  </p>
                  <p className="text-muted text-sm">@{user.username}</p>
                  <p className="text-sm text-foreground-secondary mt-0.5 line-clamp-1">
                    {user.bio}
                  </p>
                  {online && (
                    <span className="text-xs text-green-500 font-medium mt-1 block">
                      ● Online
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/messages/${user._id}`)}
                    className="size-10 flex items-center justify-center rounded-xl bg-primary/10 hover:bg-primary/20 text-primary active:scale-95 transition cursor-pointer"
                    title="Message"
                  >
                    <MessageSquare className="size-4" />
                  </button>
                  <button
                    onClick={() => navigate(`/profile/${user._id}`)}
                    className="size-10 flex items-center justify-center rounded-xl bg-surface hover:bg-slate-200 dark:hover:bg-slate-700 text-foreground active:scale-95 transition cursor-pointer"
                    title="View Profile"
                  >
                    <Eye className="size-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showCreateGroup && <CreateGroupModal onClose={() => setShowCreateGroup(false)} />}
    </div>
  );
};

export default Message;