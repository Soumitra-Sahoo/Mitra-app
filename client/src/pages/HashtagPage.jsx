import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios.js";
import toast from "react-hot-toast";
import PostCard from "../components/PostCard";
import { Hash, ArrowLeft } from "lucide-react";

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

const HashtagPage = () => {
  const { tag } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        const { data } = await api.get(`/api/post/hashtag/${tag}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (data.success) setPosts(data.posts);
        else toast.error(data.message);
      } catch (e) {
        toast.error(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tag]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-3xl mx-auto p-6">
        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition mb-6"
        >
          <ArrowLeft className="size-4" /> Back
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="size-14 bg-indigo-100 rounded-2xl flex items-center justify-center">
            <Hash className="size-7 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">#{tag}</h1>
            {!loading && (
              <p className="text-slate-500 text-sm mt-0.5">
                {posts.length} {posts.length === 1 ? "post" : "posts"}
              </p>
            )}
          </div>
        </div>

        {/* Posts */}
        <div className="flex flex-col items-center gap-6">
          {loading &&
            Array(3)
              .fill(0)
              .map((_, i) => <PostSkeleton key={i} />)}

          {!loading && posts.length === 0 && (
            <div className="text-center py-20">
              <Hash className="size-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">
                No posts with #{tag} yet
              </p>
              <p className="text-slate-400 text-sm mt-1">
                Be the first to post with this hashtag!
              </p>
            </div>
          )}

          {posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HashtagPage;
