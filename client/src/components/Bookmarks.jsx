import React, { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios.js";
import toast from "react-hot-toast";
import PostCard from "../components/PostCard.jsx";

const Bookmarks = () => {
  const { getToken } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const { data } = await api.get("/api/bookmark", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) setPosts(data.posts);
      else toast.error(data.message);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const handlePostDelete = (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-3xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="flex items-center gap-3 text-3xl font-bold text-foreground mb-2">
            <Bookmark className="size-7 shrink-0" />
            <span>Bookmarks</span>
          </h1>
          <p className="text-foreground-secondary">Posts you've saved for later</p>
        </div>

        <div className="flex flex-col items-center gap-6">
          {loading && (
            <p className="text-muted text-sm mt-10">Loading...</p>
          )}
          {!loading && posts.length === 0 && (
            <div className="text-center mt-16">
              <Bookmark className="size-12 text-border mx-auto mb-4" />
              <p className="text-foreground-secondary font-medium">No bookmarks yet</p>
              <p className="text-muted text-sm mt-1">
                Tap the bookmark icon on any post to save it here
              </p>
            </div>
          )}
          {posts.map((post) => (
            <PostCard key={post._id} post={post} onDelete={handlePostDelete} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Bookmarks;