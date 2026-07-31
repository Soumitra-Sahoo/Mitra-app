import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import CommandPalette from "../components/CommandPalette.jsx";
import BottomNav from "../components/BottomNav.jsx";
import FloatingCreateButton from "../components/FloatingCreateButton.jsx";
import { Outlet } from "react-router-dom";
import Loading from "../components/Loading";
import { useSelector } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios.js";

const Layout = () => {
  const user = useSelector((state) => state.user.value);
  const { getToken } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchCounts = async () => {
      try {
        const token = await getToken();
        const headers = { Authorization: `Bearer ${token}` };
        const [notifRes, msgRes] = await Promise.all([
          api.get("/api/notification/unread", { headers }),
          api.get("/api/message/unread/count", { headers }),
        ]);
        if (notifRes.data.success) setNotificationCount(notifRes.data.count);
        if (msgRes.data.success) setMessageCount(msgRes.data.count);
      } catch (_) {}
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 60000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user) return <Loading />;

  return (
    <div className="h-screen flex flex-col bg-background transition-theme">
      <Header
        notificationCount={notificationCount}
        messageCount={messageCount}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onOpenSearch={() => setSearchOpen(true)}
      />
      <CommandPalette isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          notificationCount={notificationCount}
          setNotificationCount={setNotificationCount}
        />
        <div className="flex-1 overflow-y-auto pb-16 sm:pb-0">
          <Outlet />
        </div>
      </div>
      <BottomNav notificationCount={notificationCount} messageCount={messageCount} />
      <FloatingCreateButton />
    </div>
  );
};

export default Layout;