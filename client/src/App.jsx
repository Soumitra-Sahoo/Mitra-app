import React, {
  useRef,
  useEffect,
  useState,
  createContext,
  useContext,
} from "react";
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
import Bookmarks from "./components/Bookmarks.jsx";
import { useUser, useAuth } from "@clerk/clerk-react";
import toast, { Toaster } from "react-hot-toast";
import { useDispatch } from "react-redux";
import { fetchUser } from "./store/slices/userSlice.js";
import { fetchConnections } from "./store/slices/connectionSlice.js";
import {
  addMessage,
  markMessagesSeen,
  updateMessageInStore,
  markMessageDeletedInStore,
} from "./store/slices/messagesSlice.js";
import Notification from "./components/Notification.jsx";
import OnboardingModal from "./components/OnboardingModal.jsx";
import Loading from "./components/Loading.jsx";
import IncomingCallModal from "./components/IncomingCallModal.jsx";
import ActiveCall from "./components/ActiveCall.jsx";
import { useCall } from "./context/CallContext.jsx";

export const OnlineContext = createContext({
  onlineUsers: new Set(),
  typingUsers: {},
  groupEvents: null,
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
  const [groupEventTick, setGroupEventTick] = useState(0);

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
    let eventSource;
    let cancelled = false;
    let reconnectTimeout;

    const currentGroupId = () => {
      const match = pathnameRef.current.match(/^\/messages\/group\/([^/]+)/);
      return match ? match[1] : null;
    };
    const currentDmId = () => {
      const match = pathnameRef.current.match(/^\/messages\/([^/]+)$/);
      return match ? match[1] : null;
    };

    const handleMessage = (event) => {
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
        const key = data.group_id ? `group:${data.group_id}` : data.from;
        setTypingUsers((prev) => ({ ...prev, [key]: data.isTyping }));
        return;
      }

      if (data.type === "seen") {
        dispatch(markMessagesSeen(data.by));
        return;
      }

      if (data.type === "message-edited") {
        if (
          (data.group_id && data.group_id === currentGroupId()) ||
          (!data.group_id && currentDmId())
        ) {
          dispatch(
            updateMessageInStore({
              messageId: data.messageId,
              text: data.text,
              edited_at: data.edited_at,
            }),
          );
        }
        return;
      }

      if (data.type === "message-deleted") {
        if (
          (data.group_id && data.group_id === currentGroupId()) ||
          (!data.group_id && currentDmId())
        ) {
          dispatch(markMessageDeletedInStore({ messageId: data.messageId }));
        }
        return;
      }

      if (data.type === "group-updated") {
        setGroupEventTick((t) => t + 1);
        return;
      }

      if (typeof data.type === "string" && data.type.startsWith("call-")) {
        handleSignal(data);
        return;
      }

      if (data.type === "group-message") {
        setGroupEventTick((t) => t + 1);
        if (data.group_id === currentGroupId()) {
          dispatch(addMessage(data));
        } else {
          toast.custom(
            (t) => (
              <Notification
                t={t}
                message={{
                  from_user_id: data.from_user_id,
                  text: data.text || "New group message",
                  _id: data._id,
                  group_id: data.group_id,
                }}
              />
            ),
            { position: "bottom-right" },
          );
        }
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

    const connect = async () => {
      if (cancelled) return;
      const token = await getToken();
      if (cancelled) return;

      eventSource = new EventSource(
        `${import.meta.env.VITE_BASE_URL}/api/message/${user.id}?token=${encodeURIComponent(token)}`,
      );

      eventSource.onmessage = handleMessage;

      eventSource.onerror = () => {
        eventSource.close();
        if (!cancelled) {
          reconnectTimeout = setTimeout(connect, 2000);
        }
      };
    };

    connect();

    return () => {
      cancelled = true;
      clearTimeout(reconnectTimeout);
      eventSource?.close();
    };
  }, [user, dispatch, handleSignal, getToken]);

  return (
    <OnlineContext.Provider value={{ onlineUsers, typingUsers, groupEventTick }}>
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
          <Route path="messages/group/:groupId" element={<ChatBox />} />
          <Route path="connections" element={<Connections />} />
          <Route path="discover" element={<Discover />} />
          <Route path="bookmarks" element={<Bookmarks />} />
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