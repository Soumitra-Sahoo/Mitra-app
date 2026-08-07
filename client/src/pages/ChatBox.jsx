import React, { useEffect, useRef, useState } from "react";
import {
  ImageIcon,
  SendHorizonal,
  Smile,
  Phone,
  Video,
  PhoneMissed,
  PhoneOff,
  MoreVertical,
  X,
  Users,
  Reply as ReplyIcon,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios.js";
import EmojiPicker from "emoji-picker-react";
import {
  addMessage,
  fetchMessages,
  resetMessages,
  updateMessageInStore,
  markMessageDeletedInStore,
  removeMessageFromStore,
} from "../store/slices/messagesSlice.js";
import { toast } from "react-hot-toast";
import { useOnline } from "../App.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { useCall } from "../context/CallContext.jsx";
import MessageActionsMenu from "../components/MessageActionsMenu.jsx";
import ForwardModal from "../components/ForwardModal.jsx";
import GroupInfoPanel from "../components/GroupInfoPanel.jsx";

const formatCallDuration = (seconds) => {
  const total = seconds || 0;
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const LONG_PRESS_MS = 500;

const ChatBox = () => {
  const { messages } = useSelector((state) => state.messages);
  const currentUser = useSelector((state) => state.user.value);
  const { userId, groupId } = useParams();
  const { getToken } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { onlineUsers, typingUsers } = useOnline();
  const { resolvedTheme } = useTheme();
  const { callState, startCall } = useCall();

  const isGroup = Boolean(groupId);

  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [user, setUser] = useState(null);
  const [group, setGroup] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [menuState, setMenuState] = useState(null);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [groups, setGroups] = useState([]);

  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);
  const longPressTimer = useRef(null);
  const connections = useSelector((state) => state.connections.connections);

  const isOnline = !isGroup && onlineUsers.has(userId);
  const otherTyping = isGroup ? typingUsers[`group:${groupId}`] : typingUsers[userId];

  useEffect(() => {
    if (!image) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const fetchUserMessages = async () => {
    try {
      const token = await getToken();
      dispatch(fetchMessages({ token, userId, groupId }));
    } catch (error) {
      toast.error(error.message);
    }
  };

  const fetchGroupInfo = async () => {
    try {
      const token = await getToken();
      const { data } = await api.get(`/api/group/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) setGroup(data.group);
      else toast.error(data.message);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const fetchGroupsForForward = async () => {
    try {
      const token = await getToken();
      const { data } = await api.get("/api/group", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) setGroups(data.groups);
    } catch (_) {}
  };

  const sendTypingEvent = async (typing) => {
    try {
      const token = await getToken();
      await api.post(
        "/api/message/typing",
        isGroup
          ? { group_id: groupId, isTyping: typing }
          : { to: userId, isTyping: typing },
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

  const resetComposer = () => {
    setText("");
    setImage(null);
    setShowEmoji(false);
    setReplyingTo(null);
    clearTimeout(typingTimeout.current);
    if (isTyping) {
      setIsTyping(false);
      sendTypingEvent(false);
    }
  };

  const sendMessage = async () => {
    try {
      if (!text && !image) return;

      if (editingMessage) {
        const token = await getToken();
        const { data } = await api.put(
          `/api/message/${editingMessage._id}/edit`,
          { text },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (data.success) {
          dispatch(
            updateMessageInStore({
              messageId: editingMessage._id,
              text,
              edited_at: new Date().toISOString(),
            }),
          );
          setEditingMessage(null);
          setText("");
        } else {
          toast.error(data.message);
        }
        return;
      }

      const token = await getToken();
      const formData = new FormData();
      if (isGroup) formData.append("group_id", groupId);
      else formData.append("to_user_id", userId);
      formData.append("text", text);
      if (replyingTo) formData.append("reply_to", replyingTo._id);
      image && formData.append("image", image);

      const { data } = await api.post("/api/message/send", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        resetComposer();
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
  }, [userId, groupId]);

  useEffect(() => {
    if (isGroup) fetchGroupInfo();
  }, [groupId]);

  useEffect(() => {
    if (!isGroup && connections.length > 0) {
      setUser(connections.find((c) => c._id === userId) || null);
    }
  }, [connections, userId, isGroup]);

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

  const openMenu = (message, clientX, clientY) => {
    setMenuState({ message, anchorPoint: { x: clientX, y: clientY } });
  };

  const handleTouchStart = (message, e) => {
    const touch = e.touches[0];
    longPressTimer.current = setTimeout(() => {
      openMenu(message, touch.clientX, touch.clientY);
    }, LONG_PRESS_MS);
  };
  const cancelLongPress = () => clearTimeout(longPressTimer.current);

  const handleCopy = (message) => {
    navigator.clipboard.writeText(message.text || "");
    toast.success("Copied");
  };

  const handleDeleteForMe = async (message) => {
    try {
      const token = await getToken();
      const { data } = await api.delete(`/api/message/${message._id}/delete-for-me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        dispatch(removeMessageFromStore(message._id));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDeleteForEveryone = async (message) => {
    try {
      const token = await getToken();
      const { data } = await api.delete(`/api/message/${message._id}/delete-for-everyone`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        dispatch(markMessageDeletedInStore({ messageId: message._id }));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEdit = (message) => {
    setEditingMessage(message);
    setText(message.text);
    setReplyingTo(null);
  };

  const handleForward = (message) => {
    fetchGroupsForForward();
    setForwardingMessage(message);
  };

  if (!isGroup && !user) return null;
  if (isGroup && !group) return null;

  const headerName = isGroup ? group.name : user.full_name;
  const headerPhoto = isGroup ? group.photo : user.profile_picture;
  const headerSubtitle = otherTyping
    ? "typing..."
    : isGroup
      ? `${group.members.length} members`
      : isOnline
        ? "Online"
        : `@${user.username}`;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-3 md:px-10 xl:pl-42 bg-surface border-b border-border shadow-sm">
        <div
          className={`relative ${isGroup ? "cursor-pointer" : ""}`}
          onClick={() => isGroup && setShowGroupInfo(true)}
        >
          {headerPhoto ? (
            <img
              src={headerPhoto}
              className="aspect-square object-cover size-10 rounded-full"
              alt=""
            />
          ) : (
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="size-5 text-primary" />
            </div>
          )}
          {isOnline && (
            <span className="absolute bottom-0 right-0 size-3 bg-success rounded-full border-2 border-white" />
          )}
        </div>
        <div
          className={isGroup ? "cursor-pointer" : ""}
          onClick={() => isGroup && setShowGroupInfo(true)}
        >
          <p className="font-semibold text-foreground">{headerName}</p>
          <p className="text-xs text-muted">
            {otherTyping ? (
              <span className="text-primary font-medium">typing...</span>
            ) : isGroup ? (
              headerSubtitle
            ) : isOnline ? (
              <span className="text-success">Online</span>
            ) : (
              headerSubtitle
            )}
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {isGroup ? (
            <button
              disabled
              title="Group calling supports up to 4 participants — coming soon"
              className="size-9 flex items-center justify-center rounded-full bg-card/70 text-primary opacity-40 cursor-not-allowed"
            >
              <Phone className="size-4" />
            </button>
          ) : (
            <>
              <button
                onClick={() => startCall(user, "audio")}
                disabled={callState !== "idle"}
                className="size-9 flex items-center justify-center rounded-full bg-card/70 hover:bg-card text-primary transition disabled:opacity-40 disabled:cursor-not-allowed"
                title="Voice call"
              >
                <Phone className="size-4" />
              </button>
              <button
                onClick={() => startCall(user, "video")}
                disabled={callState !== "idle"}
                className="size-9 flex items-center justify-center rounded-full bg-card/70 hover:bg-card text-primary transition disabled:opacity-40 disabled:cursor-not-allowed"
                title="Video call"
              >
                <Video className="size-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="p-5 md:px-10 h-full overflow-y-scroll">
        <div className="space-y-4 max-w-4xl mx-auto">
          {[...messages]
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
            .map((message, index) => {
              const isMyMessage = message.from_user_id?._id === currentUser?._id;
              if (message.message_type === "system") {
                return (
                  <div key={message._id || index} className="flex justify-center">
                    <div className="text-xs text-muted bg-surface px-3 py-1.5 rounded-full">
                      {message.text}
                    </div>
                  </div>
                );
              }

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
                  <div key={message._id || index} className="flex justify-center">
                    <div className="flex items-center gap-2 text-xs text-foreground-secondary bg-surface px-3 py-1.5 rounded-full">
                      <CallIcon className="size-3.5" />
                      {label}
                    </div>
                  </div>
                );
              }

              const senderName = message.from_user_id?.full_name;
              const senderPhoto = message.from_user_id?.profile_picture;

              return (
                <div
                  key={message._id || index}
                  className={`group flex flex-col ${isMyMessage ? "items-end" : "items-start"}`}
                >
                  {isGroup && !isMyMessage && senderName && (
                    <p className="text-xs font-medium text-primary mb-0.5 ml-1">
                      {senderName}
                    </p>
                  )}
                  <div className="flex items-center gap-1">
                    {isMyMessage && (
                      <button
                        onClick={(e) => openMenu(message, e.clientX, e.clientY)}
                        className="opacity-0 group-hover:opacity-100 transition text-muted hover:text-foreground"
                      >
                        <MoreVertical className="size-4" />
                      </button>
                    )}
                    <div
                      onContextMenu={(e) => {
                        e.preventDefault();
                        openMenu(message, e.clientX, e.clientY);
                      }}
                      onTouchStart={(e) => handleTouchStart(message, e)}
                      onTouchEnd={cancelLongPress}
                      onTouchMove={cancelLongPress}
                      className={`p-2.5 text-sm max-w-sm rounded-2xl shadow-sm select-none
                        ${
                          isMyMessage
                            ? "bg-gradient-to-br from-gradient-start to-gradient-end text-white rounded-br-none"
                            : "bg-card text-foreground rounded-bl-none border border-border"
                        }`}
                    >
                      {message.deleted_for_everyone ? (
                        <p className="italic opacity-70 flex items-center gap-1.5">
                          <X className="size-3.5" /> This message was deleted
                        </p>
                      ) : (
                        <>
                          {message.reply_to && (
                            <div
                              className={`text-xs mb-1.5 pl-2 border-l-2 rounded-sm py-1 px-1.5 ${
                                isMyMessage
                                  ? "border-white/40 bg-white/10"
                                  : "border-primary/50 bg-surface"
                              }`}
                            >
                              <p className="font-medium opacity-80">
                                {message.reply_to.from_user_id?.full_name || "Message"}
                              </p>
                              <p className="opacity-70 truncate">
                                {message.reply_to.text ||
                                  (message.reply_to.message_type === "image" ? "Photo" : "")}
                              </p>
                            </div>
                          )}
                          {message.forwarded && (
                            <p className="text-[10px] italic opacity-60 mb-1 flex items-center gap-1">
                              <ReplyIcon className="size-3 rotate-180" /> Forwarded
                            </p>
                          )}
                          {message.message_type === "image" && (
                            <img
                              src={message.media_url}
                              className="w-full max-w-sm rounded-lg mb-1"
                              alt=""
                            />
                          )}
                          {message.text && <p>{message.text}</p>}
                          {message.edited && (
                            <span className="text-[10px] opacity-60 italic">(edited)</span>
                          )}
                        </>
                      )}
                      {isMyMessage && !message.deleted_for_everyone && (
                        <div
                          className={`text-[10px] mt-1 text-right ${message.seen ? "text-white/90" : "text-white/50"}`}
                        >
                          {message.seen
                            ? "✓✓ Seen"
                            : message.delivered
                              ? "✓ Delivered"
                              : "✓ Sent"}
                        </div>
                      )}
                    </div>
                    {!isMyMessage && (
                      <button
                        onClick={(e) => openMenu(message, e.clientX, e.clientY)}
                        className="opacity-0 group-hover:opacity-100 transition text-muted hover:text-foreground"
                      >
                        <MoreVertical className="size-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

          {otherTyping && (
            <div className="flex items-start gap-2">
              <img
                src={isGroup ? undefined : user.profile_picture}
                className={`size-7 rounded-full object-cover ${isGroup ? "invisible" : ""}`}
                alt=""
              />
              <div className="bg-card border border-border rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-1">
                <span className="size-2 bg-muted rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="size-2 bg-muted rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="size-2 bg-muted rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="px-4 pb-5 pt-2 relative">
        {(replyingTo || editingMessage) && (
          <div className="max-w-xl mx-auto mb-2 flex items-center justify-between bg-surface rounded-xl px-4 py-2">
            <div className="min-w-0">
              <p className="text-xs font-medium text-primary">
                {editingMessage ? "Editing message" : `Replying to ${replyingTo.from_user_id?.full_name || "message"}`}
              </p>
              <p className="text-xs text-foreground-secondary truncate">
                {(editingMessage || replyingTo).text || "Photo"}
              </p>
            </div>
            <button
              onClick={() => {
                setReplyingTo(null);
                if (editingMessage) {
                  setEditingMessage(null);
                  setText("");
                }
              }}
              className="text-slate-400 hover:text-foreground transition flex-shrink-0 ml-2"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        {showEmoji && (
          <div className="emoji-wrapper absolute bottom-20 left-4 z-50">
            <EmojiPicker
              onEmojiClick={onEmojiClick}
              height={380}
              width={320}
              theme={resolvedTheme}
            />
          </div>
        )}

        <div className="flex items-center gap-2 pl-3 p-1.5 bg-card w-full max-w-xl mx-auto border border-border shadow-md rounded-full">
          <button
            onClick={() => setShowEmoji((v) => !v)}
            className="emoji-wrapper text-muted hover:text-yellow-500 transition flex-shrink-0"
          >
            <Smile className="size-5" />
          </button>

          <input
            type="text"
            className="flex-1 outline-none bg-transparent text-foreground text-sm"
            placeholder={editingMessage ? "Edit message..." : "Type a message..."}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            onChange={handleTextChange}
            value={text}
          />

          {!editingMessage && (
            <label htmlFor="chat-image" className="flex-shrink-0 cursor-pointer">
              {image ? (
                <img src={imagePreview} className="h-8 rounded" alt="" />
              ) : (
                <ImageIcon className="size-5 text-muted hover:text-primary transition" />
              )}
              <input
                type="file"
                id="chat-image"
                accept="image/*"
                hidden
                onChange={(e) => setImage(e.target.files[0])}
              />
            </label>
          )}

          <button
            onClick={sendMessage}
            className="bg-gradient-to-br from-gradient-start to-gradient-end hover:brightness-110 active:scale-95 cursor-pointer text-white p-2 rounded-full transition-all duration-300 flex-shrink-0"
          >
            <SendHorizonal size={17} />
          </button>
        </div>
      </div>

      {menuState && (
        <MessageActionsMenu
          message={menuState.message}
          isMyMessage={
            menuState.message.from_user_id === currentUser?._id ||
            menuState.message.from_user_id?._id === currentUser?._id
          }
          anchorPoint={menuState.anchorPoint}
          onClose={() => setMenuState(null)}
          onReply={() => setReplyingTo(menuState.message)}
          onCopy={() => handleCopy(menuState.message)}
          onForward={() => handleForward(menuState.message)}
          onDeleteForMe={() => handleDeleteForMe(menuState.message)}
          onDeleteForEveryone={() => handleDeleteForEveryone(menuState.message)}
          onEdit={() => handleEdit(menuState.message)}
        />
      )}

      {forwardingMessage && (
        <ForwardModal
          message={forwardingMessage}
          groups={groups}
          onClose={() => setForwardingMessage(null)}
        />
      )}

      {showGroupInfo && isGroup && (
        <GroupInfoPanel
          groupId={groupId}
          onClose={() => setShowGroupInfo(false)}
          onUpdated={fetchGroupInfo}
        />
      )}
    </div>
  );
};

export default ChatBox;