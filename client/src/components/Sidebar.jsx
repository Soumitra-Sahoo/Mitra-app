import React, { useEffect, useState } from "react";
import { assets } from "../assets/assets";
import { Link, useNavigate } from "react-router-dom";
import MenuItems from "./MenuItems";
import { CirclePlus, LogOut } from "lucide-react";
import { UserButton, useClerk } from "@clerk/clerk-react";
import { useSelector } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios.js";

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.value);
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      try {
        const token = await getToken();
        const { data } = await api.get("/api/notification/unread", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (data.success) setUnreadCount(data.count);
      } catch (_) {}
    };
    fetch();
    const interval = setInterval(fetch, 60000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <div
      className={`w-56 xl:w-64 h-screen sticky top-0 bg-white/80 backdrop-blur-xl border-r border-slate-200 shadow-lg flex flex-col justify-between items-center max-sm:fixed max-sm:top-0 max-sm:bottom-0 z-20
      ${sidebarOpen ? "translate-x-0" : "max-sm:-translate-x-full"} transition-all duration-300 ease-in-out`}
    >
      <div className="w-full">
        <img
          onClick={() => navigate("/")}
          src={assets.logo}
          className="w-26 ml-7 my-2 cursor-pointer"
          alt=""
        />
        <hr className="border-gray-200 mb-8" />
        <MenuItems
          setSidebarOpen={setSidebarOpen}
          unreadCount={unreadCount}
          setUnreadCount={setUnreadCount}
        />

        <Link
          to="/create-post"
          className="flex items-center justify-center gap-2 py-2.5 mt-6 mx-6 rounded-lg bg-gradient-to-r from-blue-500 to-sky-400 hover:from-blue-600 hover:to-sky-500 active:scale-95 transition text-white cursor-pointer"
        >
          <CirclePlus className="w-5 h-5" />
          Create Post
        </Link>
      </div>

      <div className="w-full border-t border-gray-200 p-4 px-7 flex items-center justify-between">
        <div className="flex gap-2 items-center cursor-pointer">
          <UserButton />
          <div>
            <h1 className="text-sm font-medium">{user?.full_name}</h1>
            <p className="text-xs text-gray-500">@{user?.username}</p>
          </div>
        </div>
        <LogOut
          onClick={signOut}
          className="w-4.5 text-gray-400 hover:text-gray-700 transition cursor-pointer"
        />
      </div>
    </div>
  );
};

export default Sidebar;
