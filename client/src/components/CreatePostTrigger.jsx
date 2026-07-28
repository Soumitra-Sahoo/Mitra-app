import React from "react";
import { Image, PenSquare } from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const CreatePostTrigger = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.value);

  return (
    <div className="bg-card rounded-3xl border border-border shadow-sm p-4 transition hover:shadow-md">
      <div className="flex items-center gap-3">
        <img
          src={user?.profile_picture}
          alt={user?.full_name}
          className="size-11 rounded-full object-cover"
        />

        <button
          onClick={() => navigate("/create-post")}
          className="flex-1 h-11 rounded-full bg-surface text-left px-4
                     text-muted hover:bg-border transition"
        >
          What's on your mind, {user?.full_name?.split(" ")[0]}?
        </button>
      </div>

      <div className="mt-4 pt-3 border-t border-border flex items-center justify-evenly">
        <button
          onClick={() => navigate("/create-post")}
          className="flex items-center gap-2 px-3 py-2 rounded-xl
                     hover:bg-surface transition text-foreground-secondary"
        >
          <Image className="size-5 text-green-500" />
          <span className="text-sm font-medium">Photo</span>
        </button>

        <button
          onClick={() => navigate("/create-post")}
          className="flex items-center gap-2 px-3 py-2 rounded-xl
                     hover:bg-surface transition text-foreground-secondary"
        >
          <PenSquare className="size-5 text-blue-500" />
          <span className="text-sm font-medium">Write</span>
        </button>
      </div>
    </div>
  );
};

export default CreatePostTrigger;