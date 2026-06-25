import React, { useEffect, useState } from "react";
import { assets } from "../assets/assets";
import StoriesBar from "../components/StoriesBar";
import PostCard from "../components/PostCard";
import RecentMessages from "../components/RecentMessages";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios.js";
import toast from "react-hot-toast";
import { Hash, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PostSkeleton = () => (
  <div className="bg-white rounded-3xl p-5 animate-pulse shadow w-full max-w-3xl">
    <div className="flex gap-3 items-center mb-4">
      <div className="w-10 h-10 rounded-full bg-slate-200" />
      <div className="space-y-2">
        <div className="w-28 h-3 bg-slate-200 rounded" />
        <div className="w-20 h-3 bg-slate-100 rounded" />
      </div>
    </div>
    <div className="h-3 bg-slate-200 rounded mb-2" />
    <div className="h-3 bg-slate-200 rounded w-3/4 mb-4" />
    <div className="h-52 bg-slate-200 rounded-2xl" />
  </div>
);

const Feed = () => {
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hashtags, setHashtags] = useState([]);

  const { getToken } = useAuth();
  const navigate = useNavigate();

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const { data } = await api.get("/api/post/feed", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) setFeeds(data.posts);
      else toast.error(data.message);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingHashtags = async () => {
    try {
      const token = await getToken();
      const { data } = await api.get("/api/post/trending-hashtags", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) setHashtags(data.trending);
    } catch (_) {}
  };

  useEffect(() => {
    fetchFeed();
    fetchTrendingHashtags();
  }, []);

  return (
    <div className="h-full overflow-y-scroll no-scrollbar py-10 xl:pr-5 flex items-start justify-center xl:gap-8">
      {/* Stories + feed */}
      <div className="w-full max-w-3xl">
        <StoriesBar />
        <div className="p-4 space-y-6 flex flex-col items-center">
          {loading ? (
            Array(3)
              .fill(0)
              .map((_, i) => <PostSkeleton key={i} />)
          ) : feeds.length === 0 ? (
            <div className="text-center mt-16 text-slate-400">
              <p className="text-lg font-medium">Your feed is empty</p>
              <p className="text-sm mt-1">
                Follow people or connect to see their posts
              </p>
            </div>
          ) : (
            feeds.map((post) => <PostCard key={post._id} post={post} />)
          )}
        </div>
      </div>

      {/* Right sidebar */}
      <div className="max-xl:hidden sticky top-0 space-y-4">
        {/* Sponsored */}
        <div className="max-w-xs bg-white text-xs p-4 rounded-2xl inline-flex flex-col gap-2 shadow">
          <h3 className="text-slate-800 font-semibold">Sponsored</h3>
          <img
            src={assets.sponsored_img}
            alt=""
            className="w-75 h-50 rounded-xl"
          />
          <p className="text-slate-600 font-medium">Email marketing</p>
          <p className="text-slate-400">
            Supercharge your marketing with a powerful, easy-to-use platform
            built for results.
          </p>
        </div>

        {/* Trending hashtags */}
        {hashtags.length > 0 && (
          <div className="max-w-xs bg-white text-xs p-4 rounded-2xl shadow">
            <h3 className="text-slate-800 font-semibold flex items-center gap-2 mb-3">
              <TrendingUp className="size-4 text-indigo-500" /> Trending
              Hashtags
            </h3>
            <div className="space-y-2">
              {hashtags.map(({ tag, count }) => (
                <button
                  key={tag}
                  onClick={() => navigate(`/hashtag/${tag}`)}
                  className="flex items-center justify-between w-full px-3 py-1.5 rounded-xl hover:bg-slate-50 transition group"
                >
                  <span className="flex items-center gap-1 text-indigo-600 font-medium group-hover:underline">
                    <Hash className="size-3" />
                    {tag}
                  </span>
                  <span className="text-slate-400">{count} posts</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <RecentMessages />
      </div>
    </div>
  );
};

export default Feed;
