import React, { useEffect, useState } from "react";
import { Hash, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios.js";

const TrendingTopicsWidget = () => {
  const [hashtags, setHashtags] = useState([]);
  const { getToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrendingHashtags = async () => {
      try {
        const token = await getToken();
        const { data } = await api.get("/api/post/trending-hashtags", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (data.success) setHashtags(data.trending);
      } catch (_) {}
    };
    fetchTrendingHashtags();
  }, []);

  if (hashtags.length === 0) return null;

  return (
    <div className="bg-card border border-border text-xs p-4 rounded-2xl shadow-sm">
      <h3 className="text-foreground font-semibold flex items-center gap-2 mb-3">
        <TrendingUp className="size-4 text-primary" /> Trending Hashtags
      </h3>
      <div className="space-y-1">
        {hashtags.map(({ tag, count }) => (
          <button
            key={tag}
            onClick={() => navigate(`/hashtag/${tag}`)}
            className="flex items-center justify-between w-full px-3 py-1.5 rounded-xl hover:bg-surface transition group"
          >
            <span className="flex items-center gap-1 text-primary font-medium group-hover:underline">
              <Hash className="size-3" />
              {tag}
            </span>
            <span className="text-muted">{count} posts</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TrendingTopicsWidget;