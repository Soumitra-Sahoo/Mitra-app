import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios.js";
import toast from "react-hot-toast";
import PostCard from "../components/PostCard.jsx";
import Loading from "../components/Loading.jsx";

const PostView = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const [post, setPost] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const token = await getToken();
        const { data } = await api.get(`/api/post/${postId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (data.success) {
          setPost(data.post);
        } else {
          setNotFound(true);
        }
      } catch (error) {
        setNotFound(true);
      }
    };

    load();
  }, [postId, getToken]);

  if (notFound) {
    return (
      <div className="text-center mt-20 text-muted">
        <p>Post not found or you don't have permission to view it.</p>
      </div>
    );
  }
  if (!post) {
    return <Loading />;
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <PostCard
        post={post}
        onDelete={() => navigate("/")}
      />
    </div>
  );
};

export default PostView;