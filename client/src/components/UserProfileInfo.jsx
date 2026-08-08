import { Calendar, MapPin, PenBox, Verified } from "lucide-react";
import moment from "moment";
import React from "react";

const UserProfileInfo = ({ user, posts, profileId, setShowEdit }) => {
  return (
    <div className="relative px-8 pb-6 pt-2 bg-card/80 backdrop-blur-lg">
      <div className="flex flex-col md:flex-row items-start gap-4">
        <div className="absolute -top-16 left-8 z-30 size-36 rounded-full overflow-hidden border-4 border-card bg-card shadow-2xl">
          <img src={user.profile_picture} className="w-full h-full object-cover rounded-full" alt="" />
        </div>

        <div className="w-full pt-12 md:pt-6 md:pl-40">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-foreground">{user.full_name}</h1>
                {user.verified && <Verified className="size-5 text-primary" />}
              </div>
              <p className="text-foreground-secondary">
                {user.username ? `@${user.username}` : "Add a username"}
              </p>
            </div>

            {!profileId && (
              <button
                onClick={() => setShowEdit(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface hover:bg-border transition-all font-medium cursor-pointer text-foreground"
              >
                <PenBox className="size-4" />
                Edit
              </button>
            )}
          </div>
          <p className="text-foreground-secondary text-sm md:text-base max-w-2xl mt-3 leading-relaxed">
            {user.bio || "No bio added yet."}
          </p>

          <div className="flex flex-wrap items-center gap-5 text-sm text-foreground-secondary mt-4">
            <span className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-full">
              <MapPin className="size-4" />
              {user.location || "Add location"}
            </span>

            <span className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-full">
              <Calendar className="size-4" />
              Joined {moment(user.createdAt).fromNow()}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-surface rounded-2xl p-4 text-center">
              <h2 className="text-2xl font-bold text-foreground">{posts.length}</h2>
              <p className="text-foreground-secondary text-sm">Posts</p>
            </div>

            <div className="bg-surface rounded-2xl p-4 text-center">
              <h2 className="text-2xl font-bold text-foreground">{user.followers.length}</h2>
              <p className="text-foreground-secondary text-sm">Followers</p>
            </div>

            <div className="bg-surface rounded-2xl p-4 text-center">
              <h2 className="text-2xl font-bold text-foreground">{user.following.length}</h2>
              <p className="text-foreground-secondary text-sm">Following</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileInfo;