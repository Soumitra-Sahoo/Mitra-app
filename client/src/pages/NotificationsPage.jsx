import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios.js";
import toast from "react-hot-toast";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  UserPlus,
  Users,
  Bell,
  CheckCheck,
} from "lucide-react";

const typeIcon = (type) => {
  switch (type) {
    case "like":
      return <Heart className="size-4 text-red-500    fill-red-500" />;
    case "comment":
    case "reply":
      return <MessageCircle className="size-4 text-indigo-500" />;
    case "follow":
      return <UserPlus className="size-4 text-blue-500" />;
    case "connection_request":
      return <Users className="size-4 text-purple-500" />;
    case "connection_accepted":
      return <Users className="size-4 text-green-500" />;
    default:
      return <Bell className="size-4 text-slate-400 dark:text-slate-500" />;
  }
};

const NotifSkeleton = () => (
  <div className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm animate-pulse">
    <div className="size-11 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
      <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/3" />
    </div>
  </div>
);

const NotificationsPage = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const { data } = await api.get("/api/notification", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) setNotifications(data.notifications);
      else toast.error(data.message);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      const token = await getToken();
      await api.put(
        "/api/notification/read-all",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("All marked as read");
    } catch (e) {
      toast.error(e.message);
    }
  };

  const markRead = async (id) => {
    try {
      const token = await getToken();
      await api.put(
        `/api/notification/read/${id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n)),
      );
    } catch (_) {}
  };

  const handleClick = (notif) => {
    if (!notif.read) markRead(notif._id);
    if (notif.post_id) navigate(`/profile/${notif.sender_id._id}`);
    else if (notif.type === "follow" || notif.type === "connection_request")
      navigate(`/profile/${notif.sender_id._id}`);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Bell className="size-7" /> Notifications
              {unread > 0 && (
                <span className="text-sm font-semibold bg-red-500 text-white px-2 py-0.5 rounded-full">
                  {unread}
                </span>
              )}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Stay up to date with your activity
            </p>
          </div>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium transition"
            >
              <CheckCheck className="size-4" /> Mark all read
            </button>
          )}
        </div>

        {/* List */}
        <div className="space-y-2">
          {loading &&
            Array(5)
              .fill(0)
              .map((_, i) => <NotifSkeleton key={i} />)}

          {!loading && notifications.length === 0 && (
            <div className="text-center py-20">
              <Bell className="size-12 text-slate-200 dark:text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">No notifications yet</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm">
                When people like, comment or follow you, it'll show up here
              </p>
            </div>
          )}

          {notifications.map((notif) => (
            <div
              key={notif._id}
              onClick={() => handleClick(notif)}
              className={`flex items-start gap-3 p-4 rounded-2xl cursor-pointer transition-all hover:shadow-md
                ${notif.read ? "bg-white dark:bg-slate-900" : "bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900"}`}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <img
                  src={notif.sender_id?.profile_picture}
                  className="size-11 rounded-full object-cover"
                  alt=""
                />
                <span className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-0.5 shadow">
                  {typeIcon(notif.type)}
                </span>
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-800 dark:text-slate-100">
                  <span className="font-semibold">
                    {notif.sender_id?.full_name}
                  </span>{" "}
                  {notif.message
                    ?.replace(notif.sender_id?.full_name, "")
                    .trim()}
                </p>
                {notif.post_id?.content && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                    "{notif.post_id.content.slice(0, 60)}"
                  </p>
                )}
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  {moment(notif.createdAt).fromNow()}
                </p>
              </div>

              {/* Post thumbnail */}
              {notif.post_id?.image_urls?.[0] && (
                <img
                  src={notif.post_id.image_urls[0]}
                  className="size-12 rounded-lg object-cover flex-shrink-0"
                  alt=""
                />
              )}

              {/* Unread dot */}
              {!notif.read && (
                <span className="size-2 bg-indigo-500 rounded-full flex-shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;