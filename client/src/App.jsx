import React, {useRef, useEffect, useState, createContext, useContext} from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import Feed from "./pages/Feed";
import Message from "./pages/Message";
import ChatBox from "./pages/ChatBox";
import Connections from "./pages/Connections";
import Discover from "./pages/Discover";
import Profile from "./pages/Profile";
import CreatePost from "./pages/CreatePost";
import Layout from "./pages/Layout";
import NotificationsPage from "./pages/NotificationsPage";
import HashtagPage from "./pages/HashtagPage";
import { useUser, useAuth } from "@clerk/clerk-react";
import toast, { Toaster } from "react-hot-toast";
import { useDispatch } from "react-redux";
import { fetchUser } from "./features/user/userSlice.js";
import { fetchConnections } from "./features/connections/connectionSlice.js";
import {
  addMessage,
  markMessagesSeen,
} from "./features/messages/messagesSlice.js";
import Notification from "./components/Notification.jsx";
import OnboardingModal from "./components/OnboardingModal.jsx";
import Loading from "./components/Loading.jsx";
import IncomingCallModal from "./components/IncomingCallModal.jsx";
import ActiveCall from "./components/ActiveCall.jsx";
import { useCall } from "./context/CallContext.jsx";

export const OnlineContext = createContext({
  onlineUsers: new Set(),
  typingUsers: {},
});
export const useOnline = () => useContext(OnlineContext);

const App = () => {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const pathnameRef = useRef(pathname);
  const { handleSignal } = useCall();

  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState({}); 

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        const token = await getToken();
        dispatch(fetchUser(token));
        dispatch(fetchConnections(token));
      }
    };
    fetchData();
  }, [user, getToken, dispatch]);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (!user) return;

    const eventSource = new EventSource(
      import.meta.env.VITE_BASE_URL + "/api/message/" + user.id,
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "connected") return;

      if (data.type === "online_users") {
        setOnlineUsers(new Set(data.users));
        return;
      }
      if (data.type === "user_online") {
        setOnlineUsers((prev) => new Set([...prev, data.userId]));
        return;
      }
      if (data.type === "user_offline") {
        setOnlineUsers((prev) => {
          const s = new Set(prev);
          s.delete(data.userId);
          return s;
        });
        return;
      }
      if (data.type === "typing") {
        setTypingUsers((prev) => ({ ...prev, [data.from]: data.isTyping }));
        return;
      }
      if (data.type === "seen") {
        dispatch(markMessagesSeen(data.by));
        return;
      }
      if (typeof data.type === "string" && data.type.startsWith("call-")) {
        handleSignal(data);
        return;
      }

      if (!data?.from_user_id?._id) return;
      if (pathnameRef.current === "/messages/" + data.from_user_id._id) {
        dispatch(addMessage(data));
      } else {
        toast.custom((t) => <Notification t={t} message={data} />, {
          position: "bottom-right",
        });
      }
    };

    return () => eventSource.close();
  }, [user, dispatch, handleSignal]);

  return (
    <OnlineContext.Provider value={{ onlineUsers, typingUsers }}>
      <Toaster />
      {user && <OnboardingModal />}
      <IncomingCallModal />
      <ActiveCall />
      <Routes>
        <Route
          path="/"
          element={!isLoaded ? <Loading /> : !user ? <Login /> : <Layout />}
        >
          <Route index element={<Feed />} />
          <Route path="messages" element={<Message />} />
          <Route path="messages/:userId" element={<ChatBox />} />
          <Route path="connections" element={<Connections />} />
          <Route path="discover" element={<Discover />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:profileId" element={<Profile />} />
          <Route path="create-post" element={<CreatePost />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="hashtag/:tag" element={<HashtagPage />} />
        </Route>
      </Routes>
    </OnlineContext.Provider>
  );
};

export default App;