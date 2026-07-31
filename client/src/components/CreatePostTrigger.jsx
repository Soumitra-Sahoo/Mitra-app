import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Image } from "lucide-react";

const CreatePostTrigger = () => {
  const user = useSelector((state) => state.user.value);
  const navigate = useNavigate();

  return (
    <div className="w-full bg-card border border-border rounded-2xl shadow-sm p-4">
      <div
        onClick={() => navigate("/create-post")}
        className="flex items-center gap-3 cursor-pointer"
      >
        <img
          src={user?.profile_picture}
          className="size-10 rounded-full object-cover flex-shrink-0"
          alt=""
        />
        <div className="flex-1 px-4 py-2.5 rounded-full bg-surface text-foreground-secondary text-sm hover:bg-border/60 transition">
          What's on your mind, {user?.full_name?.split(" ")[0]}?
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
        <button
          onClick={() => navigate("/create-post")}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-surface transition text-sm text-foreground-secondary"
        >
          <Image className="size-4 text-success" />
          Photo / Video
        </button>
      </div>
    </div>
  );
};

export default CreatePostTrigger;