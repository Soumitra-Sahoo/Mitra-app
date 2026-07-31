import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { Search, Hash, X } from "lucide-react";
import api from "../api/axios.js";

const CommandPalette = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [allHashtags, setAllHashtags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const { getToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;
    setQuery("");
    setUsers([]);
    setActiveIndex(0);
    inputRef.current?.focus();

    const fetchTrending = async () => {
      try {
        const token = await getToken();
        const { data } = await api.get("/api/post/trending-hashtags", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (data.success) setAllHashtags(data.trending);
      } catch (_) {}
    };
    fetchTrending();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setUsers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const token = await getToken();
        const { data } = await api.post(
          "/api/user/discover",
          { input: query },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (data.success) setUsers(data.users.slice(0, 5));
      } catch (_) {
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, isOpen]);

  const matchingHashtags = query.trim()
    ? allHashtags.filter((h) => h.tag.toLowerCase().includes(query.trim().toLowerCase()))
    : allHashtags.slice(0, 5);

  const results = [
    ...users.map((u) => ({ type: "user", data: u })),
    ...matchingHashtags.map((h) => ({ type: "hashtag", data: h })),
  ];

  const selectResult = (result) => {
    if (!result) return;
    if (result.type === "user") navigate(`/profile/${result.data._id}`);
    else navigate(`/hashtag/${result.data.tag}`);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      selectResult(results[activeIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[400] bg-black/50 flex items-start justify-center pt-24 px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="size-5 text-muted flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search people, hashtags..."
            className="flex-1 outline-none bg-transparent text-foreground text-sm"
            aria-activedescendant={results[activeIndex] ? `cmdk-item-${activeIndex}` : undefined}
            aria-label="Search people and hashtags"
          />
          <button onClick={onClose} className="text-muted hover:text-foreground transition flex-shrink-0">
            <X className="size-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {loading && (
            <p className="text-center text-sm text-muted py-6">Searching...</p>
          )}

          {!loading && query.trim() && results.length === 0 && (
            <p className="text-center text-sm text-muted py-6">No results for "{query}"</p>
          )}

          {!loading && !query.trim() && matchingHashtags.length > 0 && (
            <p className="px-3 pt-2 pb-1 text-xs font-medium text-muted uppercase tracking-wide">
              Trending
            </p>
          )}
          {!loading && query.trim() && users.length > 0 && (
            <p className="px-3 pt-2 pb-1 text-xs font-medium text-muted uppercase tracking-wide">
              People
            </p>
          )}

          {results.map((result, i) => (
            <button
              key={result.type === "user" ? result.data._id : result.data.tag}
              id={`cmdk-item-${i}`}
              onClick={() => selectResult(result)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition ${
                i === activeIndex ? "bg-primary/10" : "hover:bg-surface"
              }`}
            >
              {result.type === "user" ? (
                <>
                  <img
                    src={result.data.profile_picture}
                    className="size-9 rounded-full object-cover flex-shrink-0"
                    alt=""
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {result.data.full_name}
                    </p>
                    <p className="text-xs text-muted truncate">@{result.data.username}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Hash className="size-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">#{result.data.tag}</p>
                    <p className="text-xs text-muted truncate">{result.data.count} posts</p>
                  </div>
                </>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-border text-xs text-muted">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border">↑↓</kbd> Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border">Enter</kbd> Select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border">Esc</kbd> Close
          </span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;