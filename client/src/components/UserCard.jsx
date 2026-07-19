import React from "react";
import { MapPin, MessageCircle, Plus, UserPlus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import { toast } from "react-hot-toast";
import { fetchUser } from "../features/user/userSlice.js";

const UserCard = ({ user }) => {
  const currentUser = useSelector((state) => state.user.value);
  const { getToken } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleFollow = async () => {
    try {
      const token = await getToken();
      const { data } = await api.post(
        "/api/user/follow",
        { id: user._id },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (data.success) {
        toast.success(data.message);
        dispatch(fetchUser(token));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleConnectionReqest = async () => {
    if (currentUser.connections.includes(user._id)) {
      return navigate("/messages/" + user._id);
    }
    try {
      const token = await getToken();
      const { data } = await api.post(
        "/api/user/connect",
        { id: user._id },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div
      key={user._id}
      className="w-full sm:w-[320px] p-5 flex flex-col justify-between bg-white/80 backdrop-blur-lg border border-white/50 rounded-3xl shadow-lg hover:-translate-y-2 hover:shadow-2xl transition-all duration-300" >
      <div className="text-center">
        <img
          src={user.profile_picture}
          className="aspect-square object-cover rounded-full w-20 mx-auto border-4 border-white shadow-2xl"
          alt=""
        />
        <p className="mt-4 font-semibold">{user.full_name}</p>
        {user.username && (
          <p className="text-gray-500 font-light">@{user.username}</p>
        )}
        {user.bio && (
          <p className="text-gray-600 mt-2 text-center text-sm px-4">
            {user.bio}
          </p>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-600">
        <div className="flex items-center gap-1 border border-gray-300 rounded-full px-3 py-1">
          <MapPin className="size-4" /> {user.location}
        </div>
        <div className="flex items-center gap-1 border border-gray-300 rounded-full px-3 py-1">
          <span>{user.followers.length}</span> Followers
        </div>
      </div>
      <div className="flex mt-4 gap-2">
        <button
          onClick={handleFollow}
          disabled={currentUser?.following.includes(user._id)}
          className="w-full py-2.5 rounded-xl flex justify-center items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 active:scale-95 transition-all duration-300 text-white cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          <UserPlus className="size-4" />{" "}
          {currentUser?.following.includes(user._id) ? "Following" : "Follow"}
        </button>
        <button
          onClick={handleConnectionReqest}
          className="flex items-center justify-center w-14 bg-slate-100 hover:bg-blue-50 text-slate-700 group rounded-xl cursor-pointer active:scale-95 transition-all duration-300"
        >
          {currentUser?.connections.includes(user._id) ? (
            <MessageCircle className="size-5 group-hover:scale-105 transition" />
          ) : (
            <Plus className="size-5 group-hover:scale-105 transition" />
          )}
        </button>
      </div>
    </div>
  );
};

export default UserCard;