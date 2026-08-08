import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useClerk } from "@clerk/clerk-react";
import {
  Search,
  MessageCircle,
  Bell,
  Plus,
  ChevronDown,
  LogOut,
  User,
  Menu,
  X,
} from "lucide-react";
import { assets } from "../assets/assets.js";

const Header = ({
  notificationCount,
  messageCount,
  sidebarOpen,
  setSidebarOpen,
  onOpenSearch,
}) => {
  const user = useSelector((state) => state.user.value);
  const { signOut } = useClerk();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center gap-4 px-4 md:px-6 bg-navbar backdrop-blur-md border-b border-border transition-theme">
      <button
        onClick={() => setSidebarOpen((v) => !v)}
        className="sm:hidden size-10 flex items-center justify-center rounded-full hover:bg-surface transition"
        aria-label="Toggle menu"
      >
        {sidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      <Link to="/" className="flex items-center gap-2 flex-shrink-0">
        <img
          src={
            document.documentElement.classList.contains("dark")
              ? assets.logoDark
              : assets.logoLight
          }
          alt="Mitra"
        />
      </Link>

      <button
        onClick={onOpenSearch}
        className="hidden md:flex flex-1 max-w-md items-center gap-2 px-4 py-2.5 rounded-full bg-surface hover:bg-border/60 text-foreground-secondary text-sm transition"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Search people, hashtags...</span>
        <kbd className="text-xs px-1.5 py-0.5 rounded bg-card border border-border text-muted">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1.5 md:gap-2">
        <button
          onClick={onOpenSearch}
          className="md:hidden size-10 flex items-center justify-center rounded-full hover:bg-surface transition"
          aria-label="Search"
        >
          <Search className="size-5" />
        </button>

        <Link
          to="/messages"
          className="hidden sm:flex relative size-10 items-center justify-center rounded-full hover:bg-surface transition"
          aria-label="Messages"
        >
          <MessageCircle className="size-5" />
          {messageCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-danger text-white text-[10px] font-bold">
              {messageCount > 99 ? "99+" : messageCount}
            </span>
          )}
        </Link>

        <Link
          to="/notifications"
          className="hidden sm:flex relative size-10 items-center justify-center rounded-full hover:bg-surface transition"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-danger text-white text-[10px] font-bold">
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          )}
        </Link>

        <Link
          to="/create-post"
          className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-gradient-start to-gradient-end text-white text-sm font-medium shadow-md hover:brightness-110 transition"
        >
          <Plus className="size-4" />
          Create
        </Link>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown((v) => !v)}
            className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full hover:bg-surface transition"
          >
            <img
              src={user?.profile_picture}
              className="size-8 rounded-full object-cover"
              alt=""
            />
            <span className="hidden lg:block text-sm font-medium">
              {user?.full_name}
            </span>
            <ChevronDown className="size-3.5 text-foreground-secondary" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-xl shadow-lg bg-card border border-border overflow-hidden">
              <Link
                to="/profile"
                onClick={() => setShowDropdown(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-surface transition"
              >
                <User className="size-4" />
                Profile
              </Link>
              <button
                onClick={signOut}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-danger hover:bg-danger/10 transition"
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
