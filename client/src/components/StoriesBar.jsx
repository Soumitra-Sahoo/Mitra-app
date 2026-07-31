import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import moment from "moment";
import StoryModel from "./StoryModel";
import StoryViewer from "./StoryViewer";
import { useAuth } from "@clerk/clerk-react";
import { useSelector } from "react-redux";
import api from "../api/axios.js";
import toast from "react-hot-toast";

const StoriesBar = () => {
  const { getToken } = useAuth();
  const currentUser = useSelector((state) => state.user.value);
  const [stories, setStories] = useState([]);
  const [showModel, setShowModel] = useState(false);
  const [viewStory, setViewStory] = useState(false);

  const fetchStories = async () => {
    try {
      const token = await getToken();
      const { data } = await api.get("/api/story/get", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setStories(data.stories);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };
  useEffect(() => {
    fetchStories();
  }, []);

  const latestPerUser = Object.values(
    stories.reduce((acc, story) => {
      const id = story.user._id;
      if (!acc[id] || new Date(story.createdAt) > new Date(acc[id].createdAt)) {
        acc[id] = story;
      }
      return acc;
    }, {}),
  ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const myLatestStory = latestPerUser.find((s) => s.user._id === currentUser?._id);

  return (
    <div className="w-screen sm:w-[calc(100vw-240px)] lg:max-w-2xl no-scrollbar overflow-x-auto px-4">
      <div className="flex gap-5 pb-5">
        <div
          onClick={() => setShowModel(true)}
          className="flex flex-col items-center gap-1.5 cursor-pointer flex-shrink-0"
        >
          <div className="relative size-16">
            {myLatestStory ? (
              <div className="size-16 rounded-full p-[2.5px] bg-gradient-to-br from-gradient-start to-gradient-end">
                <img
                  src={currentUser?.profile_picture}
                  className="size-full rounded-full object-cover border-2 border-card"
                  alt=""
                />
              </div>
            ) : (
              <img
                src={currentUser?.profile_picture}
                className="size-16 rounded-full object-cover border-2 border-border"
                alt=""
              />
            )}
            <div className="absolute -bottom-0.5 -right-0.5 size-5 rounded-full bg-primary border-2 border-card flex items-center justify-center">
              <Plus className="size-3 text-white" />
            </div>
          </div>
          <p className="text-xs font-medium text-foreground text-center">Your Story</p>
        </div>

        {latestPerUser
          .filter((s) => s.user._id !== currentUser?._id)
          .map((story) => (
            <div
              key={story._id}
              onClick={() => setViewStory(story)}
              className="flex flex-col items-center gap-1.5 cursor-pointer flex-shrink-0 group"
            >
              <div className="size-16 rounded-full p-[2.5px] bg-gradient-to-br from-gradient-start to-gradient-end transition group-hover:scale-105 group-active:scale-95">
                <img
                  src={story.user.profile_picture}
                  className="size-full rounded-full object-cover border-2 border-card"
                  alt=""
                />
              </div>
              <p className="text-xs font-medium text-foreground text-center max-w-16 truncate">
                {story.user.full_name}
              </p>
            </div>
          ))}
      </div>
      {showModel && (
        <StoryModel setShowModel={setShowModel} fetchStories={fetchStories} />
      )}
      {viewStory && (
        <StoryViewer viewStory={viewStory} setViewStory={setViewStory} />
      )}
    </div>
  );
};

export default StoriesBar;