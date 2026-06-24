import { BadgeCheck, Heart, MessageCircle, Share2 } from "lucide-react";
import React, { useState } from "react";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios.js";
import toast from "react-hot-toast";

const PostCard = ({ post }) => {
  const postWithHashtags = post.content?.replace(
    /(#\w+)/g,
    '<span class="text-indigo-600">$1</span>',
  );
  const [likes, setLikes] = useState(post.likes_count);
  const currentUser = useSelector((state) => state.user.value);

  const navigate = useNavigate();
  const { getToken } = useAuth();

  const handleLike = async () => {
    try {
      const token = await getToken();
      const { data } = await api.post(
        "/api/post/like",
        { postId: post._id },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (data.success) {
        toast.success(data.message);
        setLikes((prev) => {
          if (prev.includes(currentUser?._id)) {
            return prev.filter((id) => id !== currentUser?._id);
          } else {
            return [...prev, currentUser?._id];
          }
        });
      } else {
        toast(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-lg border border-white/50 p-5 space-y-4 w-full max-w-3xl hover:shadow-2xl transition-all duration-300">
      {/* User Info */}
      <div
        onClick={() => navigate(`/profile/${post.user._id}`)}
        className="inline-flex items-center gap-3 cursor-pointer"
      >
        <img
          src={post.user.profile_picture}
          alt=""
          className="aspect-square object-cover w-10 h-10 rounded-full shadow"
        />
        <div>
          <div className="flex items-center space-x-1">
            <span className="font-semibold text-slate-800">
              {post.user.full_name}
            </span>
            <BadgeCheck className="size-4 text-blue-500" />
          </div>
          <div className="text-gray-500 text-sm">
            @{post.user.username} • {moment(post.createdAt).fromNow()}
          </div>
        </div>
      </div>

      {/* Content */}
      {post.content && (
        <div
          className="text-gray-800 text-sm whitespace-pre-line"
          dangerouslySetInnerHTML={{ __html: postWithHashtags }}
        />
      )}

      {/* Images */}
      <div className="grid grid-cols-2 gap-2 overflow-hidden rounded-2xl">
        {post.image_urls.map((img, index) => (
          <img
            key={index}
            src={img}
            className={`w-full bg-slate-100 rounded-xl
      ${
        post.image_urls.length === 1
          ? "max-h-[500px] object-contain"
          : "h-64 object-cover"
      }`}
            alt=""
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 text-gray-600 text-sm pt-2 border-t border-gray-300">
        <div className="flex items-center gap-1">
          <Heart
            className={`size-4 cursor-pointer ${likes.includes(currentUser?._id) && "text-red-500 fill-red-500"}`}
            onClick={handleLike}
          />
          <span>{likes.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <MessageCircle className="size-4" />
          <span>{3}</span>
        </div>
        <div className="flex items-center gap-1">
          <Share2 className="size-4" />
          <span>{9}</span>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
