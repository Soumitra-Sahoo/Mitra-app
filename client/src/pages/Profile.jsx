import React, { useState, useEffect, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import Loading from "../components/Loading";
import UserProfileInfo from "../components/UserProfileInfo";
import PostCard from "../components/PostCard";
import Lightbox from "../components/Lightbox";
import moment from "moment";
import ProfileModel from "../components/ProfileModel";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios.js";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";
import { ZoomIn } from "lucide-react";

const Profile = () => {
  const currentUser = useSelector((state) => state.user.value);
  const { getToken } = useAuth();
  const { profileId } = useParams();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [showEdit, setShowEdit] = useState(false);
  const [lightbox, setLightbox] = useState({
    open: false,
    images: [],
    index: 0,
  });
  const handlePostDelete = (postId) => {
  setPosts((prev) => prev.filter((p) => p._id !== postId));
};

  const openLightbox = (images, index) =>
    setLightbox({ open: true, images, index });
  const closeLightbox = () =>
    setLightbox({ open: false, images: [], index: 0 });

  const fetchUserProfile = useCallback(
    async (id) => {
      const token = await getToken();
      try {
        const { data } = await api.post(
          `/api/user/profiles`,
          { profileId: id },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (data.success) {
          setUser(data.profile);
          setPosts(data.posts);
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        toast.error(error.message);
      }
    },
    [getToken],
  );

  useEffect(() => {
    if (profileId) {
      fetchUserProfile(profileId);
    } else if (currentUser?._id) {
      fetchUserProfile(currentUser._id);
    }
  }, [profileId, currentUser?._id]);

  const likedPosts = user
    ? posts.filter((post) => post.likes_count.includes(user._id))
    : [];
  const allImages = posts.flatMap((post) => post.image_urls);
  if (!user) return <Loading />;

  return (
    <div className="relative h-full overflow-y-scroll bg-gray-50 dark:bg-slate-950 p-6">
      {lightbox.open && (
        <Lightbox
          images={lightbox.images}
          startIndex={lightbox.index}
          onClose={closeLightbox}
        />
      )}

      <div className="max-w-4xl mx-auto">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 overflow-hidden">
          <div className="relative h-64 md:h-80 overflow-hidden">
            {user.cover_photo ? (
              <img
                src={user.cover_photo}
                className="absolute inset-0 w-full h-full object-cover"
                alt="cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200" />
            )}
          </div>
          <UserProfileInfo
            user={user}
            posts={posts}
            profileId={profileId}
            setShowEdit={setShowEdit}
          />
        </div>

        <div className="mt-6">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-1 flex max-w-md mx-auto">
            {["posts", "media", "likes"].map((tab) => (
              <button
                onClick={() => setActiveTab(tab)}
                key={tab}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                  activeTab === tab
                    ? "bg-indigo-600 text-white"
                    : "text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === "posts" && (
            <div className="mt-6 flex flex-col items-center gap-6">
              {posts.length === 0 && (
                <p className="text-gray-500 dark:text-slate-400 mt-10">No posts yet</p>
              )}
              {posts.map((post) => (
                <PostCard key={post._id} post={post} onDelete={handlePostDelete}/>
              ))}
            </div>
          )}

          {activeTab === "media" && (
            <div className="mt-6">
              {allImages.length === 0 ? (
                <p className="text-gray-500 dark:text-slate-400 text-center mt-10">No media yet</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {posts
                    .filter((post) => post.image_urls.length > 0)
                    .flatMap((post) =>
                      post.image_urls.map((image, imgIdx) => ({
                        image,
                        post,
                        absIdx: allImages.indexOf(image),
                      })),
                    )
                    .map(({ image, post, absIdx }, i) => (
                      <div
                        key={i}
                        onClick={() => openLightbox(allImages, absIdx)}
                        className="relative group cursor-pointer overflow-hidden rounded-xl aspect-square bg-slate-100 dark:bg-slate-800"
                      >
                        <img
                          src={image}
                          className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                          alt=""
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition duration-300 flex items-center justify-center">
                          <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition size-7" />
                        </div>
                        <p className="absolute bottom-1 right-2 text-xs text-white opacity-0 group-hover:opacity-100 transition duration-300 drop-shadow">
                          {moment(post.createdAt).fromNow()}
                        </p>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "likes" && (
            <div className="mt-6 flex flex-col items-center gap-6">
              {likedPosts.length === 0 && (
                <p className="text-gray-500 dark:text-slate-400 mt-10">No liked posts yet</p>
              )}
              {likedPosts.map((post) => (
                <PostCard key={post._id} post={post} onDelete={handlePostDelete}/>
              ))}
            </div>
          )}
        </div>
      </div>

      {showEdit && <ProfileModel setShowEdit={setShowEdit} />}
    </div>
  );
};

export default Profile;