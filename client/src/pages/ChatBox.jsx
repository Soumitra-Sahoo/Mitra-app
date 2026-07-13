import React, { useEffect, useRef, useState } from "react";
import { ImageIcon, SendHorizonal, Smile, Phone, Video, PhoneMissed, PhoneOff } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios.js";
import EmojiPicker from "emoji-picker-react";
import {
  addMessage,
  fetchMessages,
  resetMessages,
} from "../features/messages/messagesSlice.js";
import { toast } from "react-hot-toast";
import { useOnline } from "../App.jsx";
import { useCall } from "../context/CallContext.jsx";

const formatCallDuration = (seconds) => {
  const total = seconds || 0;
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const ChatBox = () => {
  const { messages } = useSelector((state) => state.messages);
  const currentUser = useSelector((state) => state.user.value);
  const { userId } = useParams();
  const { getToken } = useAuth();
  const dispatch = useDispatch();
  const { onlineUsers, typingUsers } = useOnline();
  const { callState, startCall } = useCall();

  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [user, setUser] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isTyping, setIsTyping] = useState(false); 

  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);
  const connections = useSelector((state) => state.connections.connections);

  const isOnline = onlineUsers.has(userId);
  const otherTyping = typingUsers[userId]; 

  const fetchUserMessages = async () => {
    try {
      const token = await getToken();
      dispatch(fetchMessages({ token, userId }));
    } catch (error) {
      toast.error(error.message);
    }
  };

  const sendTypingEvent = async (typing) => {
    try {
      const token = await getToken();
      await api.post(
        "/api/message/typing",
        { to: userId, isTyping: typing },
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch (_) {}
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    if (!isTyping) {
      setIsTyping(true);
      sendTypingEvent(true);
    }
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingEvent(false);
    }, 1500);
  };

  const sendMessage = async () => {
    try {
      if (!text && !image) return;
      const token = await getToken();
      const formData = new FormData();
      formData.append("to_user_id", userId);
      formData.append("text", text);
      image && formData.append("image", image);

      const { data } = await api.post("/api/message/send", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setText("");
        setImage(null);
        setShowEmoji(false);
        clearTimeout(typingTimeout.current);
        if (isTyping) {
          setIsTyping(false);
          sendTypingEvent(false);
        }
        dispatch(addMessage(data.message));
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const onEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
  };

  useEffect(() => {
    fetchUserMessages();
    return () => {
      dispatch(resetMessages());
      clearTimeout(typingTimeout.current);
    };
  }, [userId]);

  useEffect(() => {
    if (connections.length > 0) {
      setUser(connections.find((c) => c._id === userId) || null);
    }
  }, [connections, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherTyping]);

  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest(".emoji-wrapper")) setShowEmoji(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!user) return null;

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center gap-3 p-3 md:px-10 xl:pl-42 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200 shadow-sm">
        <div className="relative">
          <img
            src={user.profile_picture}
            className="aspect-square object-cover size-10 rounded-full"
            alt=""
          />
          {isOnline && (
            <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full border-2 border-white" />
          )}
        </div>
        <div>
          <p className="font-semibold text-slate-800">{user.full_name}</p>
          <p className="text-xs text-slate-400">
            {otherTyping ? (
              <span className="text-indigo-500 font-medium">typing...</span>
            ) : isOnline ? (
              <span className="text-green-500">Online</span>
            ) : (
              `@${user.username}`
            )}
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => startCall(user, "audio")}
            disabled={callState !== "idle"}
            className="size-9 flex items-center justify-center rounded-full bg-white/70 hover:bg-white text-indigo-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
            title="Voice call"
          >
            <Phone className="size-4" />
          </button>
          <button
            onClick={() => startCall(user, "video")}
            disabled={callState !== "idle"}
            className="size-9 flex items-center justify-center rounded-full bg-white/70 hover:bg-white text-indigo-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
            title="Video call"
          >
            <Video className="size-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="p-5 md:px-10 h-full overflow-y-scroll">
        <div className="space-y-4 max-w-4xl mx-auto">
          {[...messages]
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
            .map((message, index) => {
              const isMyMessage =
                message.from_user_id === currentUser?._id ||
                message.from_user_id?._id === currentUser?._id;

              if (message.message_type === "call") {
                const CallIcon =
                  message.call_status === "completed"
                    ? message.call_type === "video"
                      ? Video
                      : Phone
                    : message.call_status === "missed"
                      ? PhoneMissed
                      : PhoneOff;
                const label =
                  message.call_status === "completed"
                    ? `${message.call_type === "video" ? "Video" : "Voice"} call · ${formatCallDuration(message.call_duration)}`
                    : message.call_status === "missed"
                      ? "Missed call"
                      : message.call_status === "declined"
                        ? "Call declined"
                        : "Call cancelled";
                return (
                  <div key={index} className="flex justify-center">
                    <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                      <CallIcon className="size-3.5" />
                      {label}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={index}
                  className={`flex flex-col ${isMyMessage ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`p-2.5 text-sm max-w-sm rounded-2xl shadow-sm
                      ${
                        isMyMessage
                          ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-none"
                          : "bg-white text-slate-700 rounded-bl-none border border-slate-100"
                      }`}
                  >
                    {message.message_type === "image" && (
                      <img
                        src={message.media_url}
                        className="w-full max-w-sm rounded-lg mb-1"
                        alt=""
                      />
                    )}
                    {message.text && <p>{message.text}</p>}
                    {isMyMessage && (
                      <div
                        className={`text-[10px] mt-1 text-right ${message.seen ? "text-blue-200" : "text-white/50"}`}
                      >
                        {message.seen
                          ? "✓✓ Seen"
                          : message.delivered
                            ? "✓ Delivered"
                            : "✓ Sent"}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

          {otherTyping && (
            <div className="flex items-start gap-2">
              <img
                src={user.profile_picture}
                className="size-7 rounded-full object-cover"
                alt=""
              />
              <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-1">
                <span className="size-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="size-2 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="size-2 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="px-4 pb-5 pt-2 relative">
        {showEmoji && (
          <div className="emoji-wrapper absolute bottom-20 left-4 z-50">
            <EmojiPicker onEmojiClick={onEmojiClick} height={380} width={320} />
          </div>
        )}

        <div className="flex items-center gap-2 pl-3 p-1.5 bg-white w-full max-w-xl mx-auto border border-gray-200 shadow-md rounded-full">
          <button
            onClick={() => setShowEmoji((v) => !v)}
            className="emoji-wrapper text-gray-400 hover:text-yellow-500 transition flex-shrink-0"
          >
            <Smile className="size-5" />
          </button>

          <input
            type="text"
            className="flex-1 outline-none text-slate-700 text-sm"
            placeholder="Type a message..."
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            onChange={handleTextChange}
            value={text}
          />

          <label htmlFor="chat-image" className="flex-shrink-0 cursor-pointer">
            {image ? (
              <img
                src={URL.createObjectURL(image)}
                className="h-8 rounded"
                alt=""
              />
            ) : (
              <ImageIcon className="size-5 text-gray-400 hover:text-indigo-500 transition" />
            )}
            <input
              type="file"
              id="chat-image"
              accept="image/*"
              hidden
              onChange={(e) => setImage(e.target.files[0])}
            />
          </label>

          <button
            onClick={sendMessage}
            className="bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 cursor-pointer text-white p-2 rounded-full transition-all duration-300 flex-shrink-0"
          >
            <SendHorizonal size={17} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;