import React from "react";
import { Link, useNavigate } from "react-router-dom";
import MenuItems from "./MenuItems";
import ThemeToggle from "./ThemeToggle.jsx";
import { CirclePlus, LogOut } from "lucide-react";
import { UserButton, useClerk } from "@clerk/clerk-react";
import { useSelector } from "react-redux";

const Sidebar = ({ sidebarOpen, setSidebarOpen, notificationCount, setNotificationCount }) => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.value);
  const { signOut } = useClerk();

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 sm:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div
        className={`w-64 h-full bg-sidebar border-r border-border flex flex-col justify-between max-sm:fixed max-sm:top-0 max-sm:bottom-0 max-sm:left-0 max-sm:z-40 z-20
        ${sidebarOpen ? "translate-x-0" : "max-sm:-translate-x-full"} transition-all duration-300 ease-in-out`}
      >
        <div className="w-full overflow-y-auto py-6">
          <MenuItems
            setSidebarOpen={setSidebarOpen}
            unreadCount={notificationCount}
            setUnreadCount={setNotificationCount}
          />

          <Link
            to="/create-post"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center justify-center gap-2 py-2.5 mt-6 mx-6 rounded-xl bg-gradient-to-r from-gradient-start to-gradient-end text-white font-medium shadow-md hover:brightness-110 transition"
          >
            <CirclePlus className="w-5 h-5" />
            Create Post
          </Link>

          <div className="flex justify-center mt-6">
            <ThemeToggle />
          </div>
        </div>

        <div className="w-full border-t border-border p-4 px-6 flex items-center justify-between">
          <div className="flex gap-2 items-center cursor-pointer" onClick={() => navigate("/profile")}>
            <UserButton />
            <div>
              <h1 className="text-sm font-medium text-foreground">{user?.full_name}</h1>
              <p className="text-xs text-foreground-secondary">@{user?.username}</p>
            </div>
          </div>
          <LogOut
            onClick={signOut}
            className="w-4.5 text-muted hover:text-foreground transition cursor-pointer"
          />
        </div>
      </div>
    </>
  );
};

export default Sidebar;