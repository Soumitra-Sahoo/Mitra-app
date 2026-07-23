import { Calendar, MapPin, PenBox, Verified } from "lucide-react";
import moment from "moment";
import React from "react";

const UserProfileInfo = ({ user, posts, profileId, setShowEdit }) => {
  return (
    <div className="relative px-8 pb-6 pt-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
      <div className="flex flex-col md:flex-row items-start gap-4">
        <div className="absolute -top-16 left-8 z-30 size-36 rounded-full overflow-hidden border-4 border-white bg-white dark:bg-slate-900 shadow-2xl">
          <img
            src={user.profile_picture}
            className="w-full h-full object-cover rounded-full"
            alt=""
          />
        </div>

        <div className="w-full pt-12 md:pt-6 md:pl-40">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">
                  {user.full_name}
                </h1>
                {user.verified && (
                  <Verified className="size-5 text-blue-500" />
                )}
              </div>
              <p className="text-gray-600 dark:text-slate-300">
                {user.username ? `@${user.username}` : "Add a username"}
              </p>
            </div>

            {/* If user is not others profile that means he is opening his profile so we will give edit button */}
            {!profileId && (
              <button
                onClick={() => setShowEdit(true)}
                className='flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-medium cursor-pointer'
              >
                <PenBox className="size-4" />
                Edit
              </button>
            )}
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base max-w-2xl mt-3 leading-relaxed">
            {user.bio || "No bio added yet."}
          </p>

          <div className="flex flex-wrap items-center gap-5 text-sm text-slate-500 dark:text-slate-400 mt-4">
            <span className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
              <MapPin className="size-4" />
              {user.location || "Add location"}
            </span>

            <span className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
              <Calendar className="size-4" />
              Joined {moment(user.createdAt).fromNow()}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-center">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {posts.length}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Posts</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-center">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {user.followers.length}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Followers</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-center">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {user.following.length}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Following</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileInfo;