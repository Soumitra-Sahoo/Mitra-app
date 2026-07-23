import {
  BadgeCheck,
  Heart,
  MessageCircle,
  Share2,
  X,
  Send,
  Trash2,
  ChevronDown,
  ChevronUp,
  Globe,
  Users,
  Lock,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios.js";
import toast from "react-hot-toast";
import Lightbox from "./Lightbox.jsx";

const renderContentWithHashtags = (text, navigate) => {
  if (!text) return null;
  return text.split(/(#\w+)/g).map((part, i) =>
    /^#\w+$/.test(part) ? (
      <span
        key={i}
        className="text-indigo-600 cursor-pointer hover:underline"
        onClick={() => navigate(`/hashtag/${part.slice(1)}`)}
      >
        {part}
      </span>
    ) : (
      part
    ),
  );
};

const VisibilityIcon = ({ visibility }) => {
  if (!visibility || visibility === "public") return null;
  const Icon = visibility === "private" ? Lock : Users;
  const label = visibility === "private" ? "Private" : "Followers only";
  return (
    <span
      title={label}
      className="inline-flex items-center gap-0.5 text-slate-400 dark:text-slate-500"
    >
      <Icon className="size-3" />
    </span>
  );
};

const CommentItem = ({
  comment,
  postId,
  currentUser,
  getToken,
  onDelete,
  depth = 0,
}) => {
  const navigate = useNavigate();
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [liked, setLiked] = useState(comment.likes?.includes(currentUser?._id));
  const [likesCount, setLikesCount] = useState(comment.likes?.length || 0);

  const handleLikeComment = async () => {
    try {
      const token = await getToken();
      const { data } = await api.post(
        `/api/comment/like/${comment._id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (data.success) {
        setLiked(data.liked);
        setLikesCount(data.likesCount);
      }
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    try {
      const token = await getToken();
      const { data } = await api.post(
        "/api/comment/add",
        {
          post_id: postId,
          text: replyText,
          parent_id: comment._id,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (data.success) {
        toast.success("Reply added");
        setReplyText("");
        setShowReplyBox(false);
        setShowReplies(true);
      } else toast.error(data.message);
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className={`flex gap-2 ${depth > 0 ? "ml-8 mt-2" : "mt-3"}`}>
      <img
        src={comment.user_id?.profile_picture}
        className="size-7 rounded-full object-cover flex-shrink-0 mt-0.5"
        alt=""
      />
      <div className="flex-1">
        <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl px-3 py-2">
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
            {comment.user_id?.full_name}
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-200 mt-0.5">
            {renderContentWithHashtags(comment.text, navigate)}
          </p>
        </div>
        <div className="flex items-center gap-3 mt-1 px-1 text-xs text-slate-400 dark:text-slate-500">
          <span>{moment(comment.createdAt).fromNow()}</span>
          <button
            onClick={handleLikeComment}
            className={`flex items-center gap-1 hover:text-red-500 transition ${liked ? "text-red-500" : ""}`}
          >
            <Heart
              className={`size-3 ${liked ? "fill-red-500 text-red-500" : ""}`}
            />
            {likesCount > 0 && <span>{likesCount}</span>}
          </button>
          {depth === 0 && (
            <button
              onClick={() => setShowReplyBox((v) => !v)}
              className="hover:text-indigo-600 transition"
            >
              Reply
            </button>
          )}
          {comment.user_id?._id === currentUser?._id && (
            <button
              onClick={() => onDelete(comment._id)}
              className="hover:text-red-500 transition"
            >
              <Trash2 className="size-3" />
            </button>
          )}
        </div>

        {/* Reply input */}
        {showReplyBox && (
          <div className="flex items-center gap-2 mt-2 ml-1">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleReply()}
              placeholder="Write a reply..."
              className="flex-1 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-full px-3 py-1.5 outline-none focus:ring-1 focus:ring-indigo-400"
            />
            <button
              onClick={handleReply}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
            >
              <Send className="size-4" />
            </button>
          </div>
        )}

        {/* Nested replies */}
        {comment.replies?.length > 0 && (
          <button
            onClick={() => setShowReplies((v) => !v)}
            className="text-xs text-indigo-600 mt-1 flex items-center gap-1 hover:underline"
          >
            {showReplies ? (
              <ChevronUp className="size-3" />
            ) : (
              <ChevronDown className="size-3" />
            )}
            {showReplies ? "Hide" : `View ${comment.replies.length}`}{" "}
            {comment.replies.length === 1 ? "reply" : "replies"}
          </button>
        )}
        {showReplies &&
          comment.replies?.map((reply) => (
            <CommentItem
              key={reply._id}
              comment={reply}
              postId={postId}
              currentUser={currentUser}
              getToken={getToken}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
      </div>
    </div>
  );
};

const PostModal = ({
  post,
  onClose,
  currentUser,
  getToken,
  likes,
  onLikeChange,
  commentCount,
  onCommentCountChange,
}) => {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchComments = async () => {
    try {
      const token = await getToken();
      const { data } = await api.get(`/api/comment/${post._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) setComments(data.comments);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    try {
      const token = await getToken();
      const { data } = await api.post(
        "/api/comment/add",
        { post_id: post._id, text: commentText },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (data.success) {
        setCommentText("");
        setComments((prev) => [{ ...data.comment, replies: [] }, ...prev]);
        onCommentCountChange((prev) => prev + 1);
      } else toast.error(data.message);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const token = await getToken();
      const { data } = await api.delete(`/api/comment/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setComments((prev) => prev.filter((c) => c._id !== commentId));
        onCommentCountChange((prev) => Math.max(0, prev - 1));
        toast.success("Deleted");
      }
    } catch (e) {
      toast.error(e.message);
    }
  };

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
        onLikeChange((prev) =>
          prev.includes(currentUser?._id)
            ? prev.filter((id) => id !== currentUser?._id)
            : [...prev, currentUser?._id],
        );
      }
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Images */}
        {post.image_urls?.length > 0 && (
          <div className="md:w-1/2 bg-black flex items-center justify-center max-h-[50vh] md:max-h-none">
            <img
              src={post.image_urls[0]}
              alt=""
              className="w-full h-full object-contain"
            />
          </div>
        )}

        {/* Right: Info + Comments */}
        <div
          className={`flex flex-col flex-1 ${post.image_urls?.length > 0 ? "md:w-1/2" : "w-full"}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
            <div
              onClick={() => {
                navigate(`/profile/${post.user._id}`);
                onClose();
              }}
              className="flex items-center gap-2 cursor-pointer"
            >
              <img
                src={post.user.profile_picture}
                className="size-9 rounded-full object-cover"
                alt=""
              />
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-sm">
                    {post.user.full_name}
                  </span>
                  {post.user.verified && (
                    <BadgeCheck className="size-4 text-blue-500" />
                  )}
                </div>
                <p className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1">
                  @{post.user.username} · {moment(post.createdAt).fromNow()}
                  <VisibilityIcon visibility={post.visibility} />
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-200 transition"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Content */}
          {post.content && (
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <p className="text-sm text-gray-800 dark:text-slate-100 whitespace-pre-line">
                {renderContentWithHashtags(post.content, navigate)}
              </p>
            </div>
          )}

          {/* Comments list */}
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
            {loading && (
              <p className="text-center text-sm text-slate-400 dark:text-slate-500 mt-4">
                Loading comments...
              </p>
            )}
            {!loading && comments.length === 0 && (
              <p className="text-center text-sm text-slate-400 dark:text-slate-500 mt-8">
                No comments yet. Be the first!
              </p>
            )}
            {comments.map((comment) => (
              <CommentItem
                key={comment._id}
                comment={comment}
                postId={post._id}
                currentUser={currentUser}
                getToken={getToken}
                onDelete={handleDeleteComment}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="border-t border-slate-100 dark:border-slate-800 p-4">
            <div className="flex items-center gap-4 mb-3 text-sm text-gray-600 dark:text-slate-300">
              <button
                onClick={handleLike}
                className="flex items-center gap-1 hover:text-red-500 transition"
              >
                <Heart
                  className={`size-5 ${likes.includes(currentUser?._id) ? "text-red-500 fill-red-500" : ""}`}
                />
                <span>{likes.length}</span>
              </button>
              <div className="flex items-center gap-1">
                <MessageCircle className="size-5" />
                <span>{commentCount}</span>
              </div>
            </div>
            {/* Add comment */}
            <div className="flex items-center gap-2">
              <img
                src={currentUser?.profile_picture}
                className="size-8 rounded-full object-cover"
                alt=""
              />
              <div className="flex-1 flex items-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-full overflow-hidden px-3">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                  placeholder="Add a comment..."
                  className="flex-1 py-2 text-sm outline-none bg-transparent text-slate-800 dark:text-slate-100"
                />
                <button
                  onClick={handleAddComment}
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition pl-2"
                >
                  <Send className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PostCard = ({ post, onDelete }) => {
  const [likes, setLikes] = useState(post.likes_count);
  const [commentCount, setCommentCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [lightbox, setLightbox] = useState({ open: false, index: 0 });

  const currentUser = useSelector((state) => state.user.value);
  const navigate = useNavigate();
  const { getToken } = useAuth();

  useEffect(() => {
    const load = async () => {
      try {
        const token = await getToken();
        const { data } = await api.get(`/api/comment/count/${post._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (data.success) setCommentCount(data.count);
      } catch (_) {}
    };
    load();
  }, [post._id]);

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
        setLikes((prev) =>
          prev.includes(currentUser?._id)
            ? prev.filter((id) => id !== currentUser?._id)
            : [...prev, currentUser?._id],
        );
      } else toast(data.message);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/profile/${post.user._id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: post.user.full_name, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard!");
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        toast.error("Couldn't share this post");
      }
    }
  };

  const isOwner = post.user._id === currentUser?._id;

  const handleDeletePost = async () => {
    if (!window.confirm("Delete this post? This can't be undone.")) return;
    try {
      const token = await getToken();
      const { data } = await api.delete(`/api/post/${post._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        toast.success("Post deleted");
        onDelete?.(post._id);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <>
      {lightbox.open && (
        <Lightbox
          images={post.image_urls}
          startIndex={lightbox.index}
          onClose={() => setLightbox({ open: false, index: 0 })}
        />
      )}
      {showModal && (
        <PostModal
          post={post}
          onClose={() => setShowModal(false)}
          currentUser={currentUser}
          getToken={getToken}
          likes={likes}
          onLikeChange={setLikes}
          commentCount={commentCount}
          onCommentCountChange={setCommentCount}
        />
      )}

      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg rounded-3xl shadow-lg border border-white/50 p-5 space-y-4 w-full max-w-3xl hover:shadow-2xl transition-all duration-300">
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
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                {post.user.full_name}
              </span>
              {post.user.verified && (
                <BadgeCheck className="size-4 text-blue-500" />
              )}
            </div>
            <div className="text-gray-500 dark:text-slate-400 text-sm flex items-center gap-1">
              @{post.user.username} • {moment(post.createdAt).fromNow()}
              <VisibilityIcon visibility={post.visibility} />
            </div>
          </div>
        </div>

        {/* Content */}
        {post.content && (
          <div className="text-gray-800 dark:text-slate-100 text-sm whitespace-pre-line">
            {renderContentWithHashtags(post.content, navigate)}
          </div>
        )}

        {/* Images — click opens lightbox */}
        {post.image_urls?.length > 0 && (
          <div className="grid grid-cols-2 gap-2 overflow-hidden rounded-2xl">
            {post.image_urls.map((img, index) => (
              <img
                key={index}
                src={img}
                onClick={() => setLightbox({ open: true, index })}
                className={`w-full bg-slate-100 dark:bg-slate-800 rounded-xl cursor-pointer hover:opacity-95 transition
                  ${post.image_urls.length === 1 ? "col-span-2 max-h-[500px] object-contain" : "h-64 object-cover"}`}
                alt=""
              />
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 text-gray-600 dark:text-slate-300 text-sm pt-2 border-t border-gray-200 dark:border-slate-700">
          <button
            onClick={handleLike}
            className="flex items-center gap-1 hover:text-red-500 transition"
          >
            <Heart
              className={`size-4 ${likes.includes(currentUser?._id) ? "text-red-500 fill-red-500" : ""}`}
            />
            <span>{likes.length}</span>
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 hover:text-indigo-600 transition"
          >
            <MessageCircle className="size-4" />
            <span>{commentCount}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1 hover:text-green-600 transition"
          >
            <Share2 className="size-4" />
          </button>

          {isOwner && (
            <button
              onClick={handleDeletePost}
              className="ml-auto flex items-center gap-1 hover:text-red-500 transition"
              title="Delete post"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default PostCard;