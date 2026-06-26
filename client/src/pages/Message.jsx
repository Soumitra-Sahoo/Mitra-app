import React from "react";
import { Eye, MessageSquare, MessageSquareText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useOnline } from "../App.jsx";

const Message = () => {
  const { connections } = useSelector((state) => state.connections);
  const { onlineUsers } = useOnline();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            <MessageSquareText className="size-7"/>Messages</h1>
          <p className="text-slate-500">Talk to your friends and family</p>
        </div>

        <div className="flex flex-col gap-3">
          {connections.length === 0 && (
            <p className="text-slate-400 text-center mt-16">
              No connections yet. Connect with people to start messaging!
            </p>
          )}
          {connections.map((user) => {
            const online = onlineUsers.has(user._id);
            return (
              <div
                key={user._id}
                className="max-w-xl flex flex-wrap gap-4 p-5 bg-white shadow-sm rounded-2xl border border-slate-100 hover:shadow-md transition-all"
              >
                {/* Avatar + online dot */}
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
                  <p className="font-semibold text-slate-800">
                    {user.full_name}
                  </p>
                  <p className="text-slate-400 text-sm">@{user.username}</p>
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
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
                    className="size-10 flex items-center justify-center rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 active:scale-95 transition cursor-pointer"
                    title="Message"
                  >
                    <MessageSquare className="size-4" />
                  </button>
                  <button
                    onClick={() => navigate(`/profile/${user._id}`)}
                    className="size-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition cursor-pointer"
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
    </div>
  );
};

export default Message;
