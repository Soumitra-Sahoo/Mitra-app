import React, { useState, useEffect } from "react";
import { Image, X, Globe, Users, Lock, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios.js";
import { useNavigate } from "react-router-dom";

const VISIBILITY_OPTIONS = [
  {
    value: "public",
    label: "Public",
    description: "Anyone can see this post",
    Icon: Globe,
  },
  {
    value: "followers",
    label: "Followers",
    description: "Only your followers can see this post",
    Icon: Users,
  },
  {
    value: "private",
    label: "Private",
    description: "Only you can see this post",
    Icon: Lock,
  },
];
const MAX_IMAGES = 4;
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
  const trimmedContent = content.trim();
  if (!images.length && !trimmedContent) {
    return toast.error("Please add at least one image or text");
  }
  setLoading(true);

  const postType =
    images.length && trimmedContent
      ? "text_with_image"
      : images.length
        ? "image"
        : "text";

    try {
      const formData = new FormData();
      formData.append("content", trimmedContent);
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
    <div className="min-h-full bg-background transition-theme">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Create Post
          </h1>
          <p className="text-foreground-secondary">
            Share your thoughts with the world
          </p>
        </div>

        <div className="max-w-xl bg-card p-4 sm:p-8 rounded-xl shadow-md space-y-4">
          <div className="flex items-center gap-3">
            <img
              src={user.profile_picture}
              className="aspect-square object-cover size-12 rounded-full shadow"
              alt=""
            />
            <div className="flex-1">
              <h2 className="font-semibold text-foreground">
                {user.full_name}
              </h2>
              <p className="text-sm text-foreground-secondary">
                @{user.username}
              </p>
              <div className="relative inline-block mt-1">
                <button
                  type="button"
                  onClick={() => setShowVisibilityMenu((v) => !v)}
                  className="flex items-center gap-1 text-xs text-foreground-secondary hover:text-foreground bg-surface hover:bg-border rounded-full px-2.5 py-1 transition mt-0.5"
                >
                  {(() => {
                    const current = VISIBILITY_OPTIONS.find(
                      (o) => o.value === visibility,
                    );
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
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowVisibilityMenu(false)}
                    />
                    <div className="absolute left-0 top-full mt-1 w-56 bg-card border border-border rounded-xl shadow-lg z-20 overflow-hidden">
                      {VISIBILITY_OPTIONS.map(
                        ({ value, label, description, Icon }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => {
                              setVisibility(value);
                              setShowVisibilityMenu(false);
                            }}
                            className={`w-full flex items-start gap-2 px-3 py-2.5 text-left hover:bg-surface transition ${
                              visibility === value ? "bg-primary/10" : ""
                            }`}
                          >
                            <Icon className="size-4 mt-0.5 text-primary flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {label}
                              </p>
                              <p className="text-xs text-muted">
                                {description}
                              </p>
                            </div>
                          </button>
                        ),
                      )}
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
            className="w-full resize-none max-h-20 mt-4 text-sm outline-none bg-transparent placeholder-muted"
            placeholder="What's happening?"
          />

          {/* Image */}
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {images.map((image, i) => (
                <div key={i} className=" relative group">
                  <img src={previews[i]} className="h-20 rounded-md" alt="" />
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
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <label
              htmlFor="images"
              className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition cursor-pointer"
            >
              <Image className="size-6" />
            </label>

            <input
              type="file"
              id="images"
              accept="image/*"
              hidden
              multiple
              onChange={(e) => {
                const incoming = Array.from(e.target.files);
                const combined = [...images, ...incoming];

                if (combined.length > MAX_IMAGES) {
                  toast.error(
                    `You can upload up to ${MAX_IMAGES} images per post`,
                  );
                  setImages(combined.slice(0, MAX_IMAGES));
                } else {
                  setImages(combined);
                }

                e.target.value = "";
              }}
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
              className="text-sm bg-gradient-to-r from-gradient-start to-gradient-end hover:brightness-110 active:scale-95 transition text-white font-medium px-8 py-2 rounded-md cursor-pointer"
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
