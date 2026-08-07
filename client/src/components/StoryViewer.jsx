import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { BadgeCheck, X } from "lucide-react";
import api from "../lib/axios";

const StoryViewer = ({ viewStory, setViewStory }) => {
  const [progress, setProgress] = useState(0);
  const { getToken } = useAuth();
  useEffect(() => {
  if (!viewStory?._id) return;
  const markViewed = async () => {
    try {
      const token = await getToken();
      await api.post(
        `/api/story/${viewStory._id}/view`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (_) {}
  };

  markViewed();
}, [viewStory?._id, getToken]);
  useEffect(() => {
    let timer, progressInterval;
    if (viewStory && viewStory.media_type !== "video") {
      setProgress(0);
      const duration = 7000; 
      const setTime = 40;
      let elapsed = 0;

      progressInterval = setInterval(() => {
        elapsed += setTime;
        setProgress((elapsed / duration) * 100);
      }, setTime);

      timer = setTimeout(() => {
        setViewStory(null);
      }, duration);
    }
    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [viewStory, setViewStory]);

  const handleClose = () => {
    setViewStory(null);
  };

  if (!viewStory) return null;

  const renderContent = () => {
    switch (viewStory.media_type) {
      case "text":
        return (
          <div
            className="w-full h-full flex items-center
                    justify-center p-8 text-white text-2xl text-center"
          >
            {viewStory.content}
          </div>
        );
      case "image":
        return (
          <img
            src={viewStory.media_url}
            alt="Story Media"
            className="max-w-full max-h-screen object-contain"
          />
        );
      case "video":
        return (
          <video
            onEnded={() => setViewStory(null)}
            src={viewStory.media_url}
            className="max-h-screen"
            controls
            autoPlay
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 h-screen bg-black bg-opacity-90 z-[110] flex items-center justify-center"
      style={{
        backgroundColor:
          viewStory.media_type === "text"
            ? viewStory.background_color
            : "#000000",
      }}
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gray-700">
        <div
          className="h-full bg-white transition-all duration-100 linear"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div className="absolute top-4 left-4 flex items-center space-x-3 p-2 px-4 sm:p-4 sm:px-8 backdrop-blur-2xl rounded bg-black/50">
        <img
          src={viewStory.user?.profile_picture}
          alt=""
          className="size-7 sm-size-8 rounded-full
        object-cover border border-white"
        />
        <div className="flex items-center gap-1">
          <span>{viewStory.user?.full_name}</span>
          {viewStory.user?.verified && <BadgeCheck size={18} />}
        </div>
      </div>
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 text-white text-3xl font-bold focus:outline-none"
      >
        <X className="w-8 h-8 hover:scale-110 transition cursor-pointer" />
      </button>

      <div className="max-w-[90vw] max-h-[90vh] flex items-center justify-center">
        {renderContent()}
      </div>
    </div>
  );
};

export default StoryViewer;