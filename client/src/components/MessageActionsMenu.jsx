import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Reply as ReplyIcon,
  Copy,
  Forward,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

const EDIT_WINDOW_MS = 10 * 60 * 1000;
const DELETE_FOR_EVERYONE_WINDOW_MS = 60 * 60 * 1000;

const MessageActionsMenu = ({
  message,
  isMyMessage,
  anchorPoint, 
  onClose,
  onReply,
  onCopy,
  onForward,
  onDeleteForMe,
  onDeleteForEveryone,
  onEdit,
}) => {
  const menuRef = useRef(null);
  const [style, setStyle] = useState({ top: anchorPoint.y, left: anchorPoint.x, opacity: 0 });

  useLayoutEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const { innerWidth, innerHeight } = window;
    const rect = el.getBoundingClientRect();
    let top = anchorPoint.y;
    let left = anchorPoint.x;
    if (left + rect.width > innerWidth - 8) left = innerWidth - rect.width - 8;
    if (top + rect.height > innerHeight - 8) top = anchorPoint.y - rect.height;
    if (top < 8) top = 8;
    if (left < 8) left = 8;
    setStyle({ top, left, opacity: 1 });
  }, [anchorPoint]);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    const escHandler = (e) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", escHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", escHandler);
    };
  }, [onClose]);

  const isDeleted = message.deleted_for_everyone;
  const isTextEditable = message.message_type === "text";
  const withinEditWindow =
    Date.now() - new Date(message.createdAt).getTime() <= EDIT_WINDOW_MS;
  const withinDeleteWindow =
    Date.now() - new Date(message.createdAt).getTime() <= DELETE_FOR_EVERYONE_WINDOW_MS;
  const isNormalMessage =
    message.message_type !== "call" && message.message_type !== "system";

  const items = [];
  if (!isDeleted && isNormalMessage) {
    items.push({ label: "Reply", Icon: ReplyIcon, onClick: onReply });
  }
  if (!isDeleted && message.text) {
    items.push({ label: "Copy", Icon: Copy, onClick: onCopy });
  }
  if (!isDeleted && isNormalMessage) {
    items.push({ label: "Forward", Icon: Forward, onClick: onForward });
  }
  if (isMyMessage && !isDeleted && isTextEditable && withinEditWindow) {
    items.push({ label: "Edit", Icon: Pencil, onClick: onEdit });
  }
  if (!isDeleted) {
    items.push({
      label: "Delete for me",
      Icon: Trash2,
      onClick: onDeleteForMe,
      danger: true,
    });
  }
  if (isMyMessage && !isDeleted && withinDeleteWindow) {
    items.push({
      label: "Delete for everyone",
      Icon: X,
      onClick: onDeleteForEveryone,
      danger: true,
    });
  }

  return (
    <div
      ref={menuRef}
      style={{ position: "fixed", top: style.top, left: style.left, opacity: style.opacity }}
      className="z-[400] w-52 bg-card rounded-xl shadow-2xl border border-border overflow-hidden transition-opacity"
    >
      {items.map(({ label, Icon, onClick, danger }) => (
        <button
          key={label}
          onClick={() => {
            onClick();
            onClose();
          }}
          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition ${
            danger
              ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
              : "text-foreground hover:bg-slate-50 dark:hover:bg-slate-700"
          }`}
        >
          <Icon className="size-4" />
          {label}
        </button>
      ))}
    </div>
  );
};

export default MessageActionsMenu;