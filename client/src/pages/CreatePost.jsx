import React, { useState, useEffect } from "react";
import { Image, X, Globe, Users, Lock, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios.js";
import { useNavigate } from "react-router-dom";

const VISIBILITY_OPTIONS = [
  { value: "public", label: "Public", description: "Anyone can see this post", Icon: Globe },
  { value: "followers", label: "Followers", description: "Only your followers can see this post", Icon: Users },
  { value: "private", label: "Private", description: "Only you can see this post", Icon: Lock },
];

const CreatePost = () => {
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visibility, setVisibility] = useState("public");
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);

  const user = useSelector((state) => state.user.value);
  const navigate = useNavigate();
  const { getToken } = useAuth();

  useEffect(() => {
    const urls = images.map((img) => URL.createObjectURL(img));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [images]);

  const handleSubmit = async () => {
  if (!images.length && !content) {
    return toast.error("Please add at least one image or text");
  }
  setLoading(true);

  const postType =
    images.length && content
      ? "text_with_image"
      : images.length
        ? "image"
        : "text";

  try {
    const formData = new FormData();
    formData.append("content", content);
    formData.append("post_type", postType);
    formData.append("visibility", visibility);
    images.forEach((image) => {
      formData.append("images", image);
    });

    const token = await getToken();
    const { data } = await api.post("/api/post/add", formData, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (data.success) {
      navigate("/");
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    toast.error(error.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-950 transition-theme">
      <div className="max-w-6xl mx-auto p-6">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Create Post
          </h1>
          <p className="text-slate-600 dark:text-slate-300">Share your thoughts with the world</p>
        </div>

        {/* Form */}
        <div className="max-w-xl bg-white dark:bg-slate-900 p-4 sm:p-8 rounded-xl shadow-md space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <img
              src={user.profile_picture}
              className="aspect-square object-cover size-12 rounded-full shadow"
              alt=""
            />
            <div className="flex-1">
              <h2 className="font-semibold">{user.full_name}</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">@{user.username}</p>
              <div className="relative inline-block mt-1">
                <button
                  type="button"
                  onClick={() => setShowVisibilityMenu((v) => !v)}
                  className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 rounded-full px-2.5 py-1 transition mt-0.5"
                >
                  {(() => {
                    const current = VISIBILITY_OPTIONS.find((o) => o.value === visibility);
                    const Icon = current.Icon;
                    return (
                      <>
                        <Icon className="size-3" />
                        {current.label}
                      </>
                    );
                  })()}
                  <ChevronDown className="size-3" />
                </button>

                {showVisibilityMenu && (
                  <>
                    {/* Click-outside overlay */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowVisibilityMenu(false)}
                    />
                    <div className="absolute left-0 top-full mt-1 w-56 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg z-20 overflow-hidden">
                      {VISIBILITY_OPTIONS.map(({ value, label, description, Icon }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => {
                            setVisibility(value);
                            setShowVisibilityMenu(false);
                          }}
                          className={`w-full flex items-start gap-2 px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-slate-800 transition ${
                            visibility === value ? "bg-indigo-50 dark:bg-indigo-950/40" : ""
                          }`}
                        >
                          <Icon className="size-4 mt-0.5 text-indigo-600 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-slate-100">{label}</p>
                            <p className="text-xs text-gray-400 dark:text-slate-500">{description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Text Area */}
          <textarea
            onChange={(e) => setContent(e.target.value)}
            value={content}
            className="w-full resize-none max-h-20 mt-4 text-sm outline-none bg-transparent placeholder-gray-400 dark:placeholder-slate-500"
            placeholder="What's happening?"
          />

          {/* Image */}
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {images.map((image, i) => (
                <div key={i} className=" relative group">
                  <img
                    src={previews[i]}
                    className="h-20 rounded-md"
                    alt=""
                  />
                  <div
                    onClick={() =>
                      setImages(images.filter((_, index) => index !== i))
                    }
                    className=" absolute hidden group-hover:flex justify-center items-center top-0 right-0 bottom-0 left-0 bg-black/40 rounded-md cursor-pointer"
                  >
                    <X className="size-6 text-white" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bootom Bar */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-300 dark:border-slate-600">
            <label
              htmlFor="images"
              className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 transition cursor-pointer"
            >
              <Image className="size-6" />
            </label>

            <input
              type="file"
              id="images"
              accept="image/*"
              hidden
              multiple
              onChange={(e) => setImages([...images, ...e.target.files])}
            />

            <button
              disabled={loading}
              onClick={() =>
                toast.promise(handleSubmit(), {
                  loading: "uploading...",
                  success: <p>Post Uploaded</p>,
                  error: <p>Post Not Uploaded</p>,
                })
              }
              className="text-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 transition text-white font-medium px-8 py-2 rounded-md cursor-pointer"
            >
              Publish Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;