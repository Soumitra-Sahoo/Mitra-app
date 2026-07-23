import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  User,
  UserCheck,
  UserPlus,
  UserRoundPen,
  Share2,
} from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import { fetchConnections } from "../store/slices/connectionSlice.js";
import api from "../api/axios.js";
import toast from "react-hot-toast";

const Connections = () => {
  const { connections, pendingConnections, followers, following } = useSelector(
    (state) => state.connections,
  );
  const { getToken } = useAuth();
  const dispatch = useDispatch();

  const [currentTab, setCurrentTab] = useState("Followers");
  const navigate = useNavigate();

  const dataArray = [
    { label: "Followers", value: followers, icon: User },
    { label: "Following", value: following, icon: UserCheck },
    { label: "Pending", value: pendingConnections, icon: UserRoundPen },
    { label: "Connections", value: connections, icon: UserPlus },
  ];

  const handleUnfollow = async (userId) => {
    try {
      const token = await getToken();
      const { data } = await api.post(
        "/api/user/unfollow",
        { id: userId },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (data.success) {
        toast.success(data.message);
        dispatch(fetchConnections(token));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const acceptConnection = async (userId) => {
    try {
      const token = await getToken();
      const { data } = await api.post(
        "/api/user/accept",
        { id: userId },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (data.success) {
        toast.success(data.message);
        dispatch(fetchConnections(token));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    getToken().then((token) => {
      dispatch(fetchConnections(token));
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto p-6">
        {/* Title */}
        <div className="mb-8">
          <h1 className="flex items-center gap-3 text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            <Share2 className="size-7 shrink-0" />
            <span>Connections</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Manage your network and discover new connections
          </p>
        </div>

        {/* Counts */}
        <div className="mb-8 flex flex-wrap gap-6">
          {dataArray.map((item, index) => (
            <div
              key={index}
              className="flex flex-col items-center justify-center gap-1 border h-20 w-40 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow rounded-md"
            >
              <b className="text-slate-900 dark:text-slate-100">{item.value.length}</b>
              <p className="text-slate-600 dark:text-slate-300">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="inline-flex flex-wrap items-center border border-gray-200 dark:border-slate-700 rounded-md p-1 bg-white dark:bg-slate-900 shadow-sm">
          {dataArray.map((tab) => (
            <button
              onClick={() => setCurrentTab(tab.label)}
              key={tab.label}
              className={`cursor-pointer flex items-center px-3 py-1 text-sm rounded-md transition-colors ${currentTab === tab.label ? "bg-white dark:bg-slate-900 font-medium text-slate-900 dark:text-slate-100" : "text-gray-500 dark:text-slate-400 hover:text-black dark:hover:text-slate-100"}`}
            >
              <tab.icon className="size-4" />
              <span className="ml-1">{tab.label}</span>
              {tab.value.length > 0 && (
                <span className="ml-2 text-xs bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 px-2 py-0.5 rounded-full">
                  {tab.value.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Connections */}
        <div className="flex flex-wrap gap-6 mt-6">
          {dataArray
            .find((item) => item.label === currentTab)
            .value.map((user) => (
              <div key={user._id} className="w-full max-w-88 flex gap-5 p-6 bg-white dark:bg-slate-900 shadow rounded-md">
                <img
                  src={user.profile_picture}
                  alt=""
                  className="aspect-square object-cover rounded-full size-12 shadow-md mx-auto"
                />
                <div className="flex-1">
                  <p className="font-medium text-slate-700 dark:text-slate-200">{user.full_name}</p>
                  <p className="text-slate-500 dark:text-slate-400">@{user.username}</p>
                  <p className="text-sm text-gray-600 dark:text-slate-300">
                    {user.bio ? `${user.bio.slice(0, 60)}...` : "No bio"}
                  </p>
                  <div className="flex max-ms:flex-col gap-2 mt-4">
                    <button
                      onClick={() => navigate(`/profile/${user._id}`)}
                      className="w-full p-2 text-sm rounded bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 transition text-white cursor-pointer"
                    >
                      View Profile
                    </button>
                    {currentTab === "Following" && (
                      <button
                        onClick={() => handleUnfollow(user._id)}
                        className="w-full p-2 text-sm rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-black active:scale-95 transition cursor-pointer"
                      >
                        Unfollow
                      </button>
                    )}
                    {currentTab === "Pending" && (
                      <button
                        onClick={() => acceptConnection(user._id)}
                        className="w-full p-2 text-sm rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-black active:scale-95 transition cursor-pointer"
                      >
                        Accept
                      </button>
                    )}
                    {currentTab === "Connections" && (
                      <button
                        onClick={() => navigate(`/messages/${user._id}`)}
                        className="w-full p-2 text-sm rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 active:scale-95 transition cursor-pointer flex items-center justify-center gap-1"
                      >
                        <MessageSquare className="size-4" />
                        Message
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Connections;