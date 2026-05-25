import React, { useEffect, useRef, useState } from "react";
import { ImageIcon, SendHorizonal } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios.js";

import {
  addMessage,
  fetchMessages,
  resetMessages,
} from "../features/messages/messagesSlice.js";

import { toast } from "react-hot-toast";

const ChatBox = () => {
  const { messages } = useSelector((state) => state.messages);

  // NEW
  const currentUser = useSelector((state) => state.user.value);

  const { userId } = useParams();
  const { getToken } = useAuth();
  const dispatch = useDispatch();

  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [user, setUser] = useState(null);

  const messagesEndRef = useRef(null);

  const connections = useSelector((state) => state.connections.connections);

  const fetchUserMessages = async () => {
    try {
      const token = await getToken();

      dispatch(fetchMessages({ token, userId }));
    } catch (error) {
      toast.error(error.message);
    }
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (data.success) {
        setText("");
        setImage(null);

        dispatch(addMessage(data.message));
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchUserMessages();

    return () => {
      dispatch(resetMessages());
    };
  }, [userId]);

  useEffect(() => {
    if (connections.length > 0) {
      const user = connections.find((connection) => connection._id === userId);

      setUser(user);
    }
  }, [connections, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  return (
    user && (
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="flex items-center gap-2 p-2 md:px-10 xl:pl-42 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-300">
          <img
            src={user.profile_picture}
            className="aspect-square object-cover size-8 rounded-full"
            alt=""
          />

          <div>
            <p className="font-medium">{user.full_name}</p>

            <p className="text-sm text-gray-500 -mt-1.5">@{user.username}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="p-5 md:px-10 h-full overflow-y-scroll">
          <div className="space-y-4 max-w-4xl mx-auto">
            {[...messages]
              .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
              .map((message, index) => {
                // NEW SAFE CHECK
                const isMyMessage =
                  message.from_user_id === currentUser?._id ||
                  message.from_user_id?._id === currentUser?._id;

                return (
                  <div
                    key={index}
                    className={`flex flex-col ${
                      isMyMessage ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`p-2 text-sm max-w-sm bg-white text-slate-700 rounded-lg shadow ${
                        isMyMessage ? "rounded-br-none" : "rounded-bl-none"
                      }`}
                    >
                      {/* Image */}
                      {message.message_type === "image" && (
                        <img
                          src={message.media_url}
                          className="w-full max-w-sm rounded-lg mb-1"
                          alt=""
                        />
                      )}

                      {/* Text */}
                      <p>{message.text}</p>

                      {/* Seen / Delivered */}
                      {isMyMessage && (
                        <div
                          className={`text-[10px] mt-1 text-right ${
                            message.seen ? "text-blue-500" : "text-gray-400"
                          }`}
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

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="px-4">
          <div className="flex items-center gap-3 pl-5 p-1.5 bg-white w-full max-w-xl mx-auto border border-gray-300 shadow rounded-full mb-5">
            <input
              type="text"
              className="flex-1 outline-none text-slate-700"
              placeholder="Type a message..."
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              onChange={(e) => setText(e.target.value)}
              value={text}
            />

            {/* Image Upload */}
            <label htmlFor="image">
              {image ? (
                <img
                  src={URL.createObjectURL(image)}
                  className="h-8 rounded"
                  alt=""
                />
              ) : (
                <ImageIcon className="size-7 text-gray-400 cursor-pointer" />
              )}

              <input
                type="file"
                id="image"
                accept="image/*"
                hidden
                onChange={(e) => setImage(e.target.files[0])}
              />
            </label>

            {/* Send Button */}
            <button
              onClick={sendMessage}
              className="bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 cursor-pointer text-white p-2 rounded-full transition-all duration-300"
            >
              <SendHorizonal size={18} />
            </button>
          </div>
        </div>
      </div>
    )
  );
};

export default ChatBox;
