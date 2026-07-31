import React, { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios.js";
import toast from "react-hot-toast";
import { fetchUser } from "../store/slices/userSlice.js";

const SuggestedConnectionsWidget = () => {
  const [suggestions, setSuggestions] = useState([]);
  const currentUser = useSelector((state) => state.user.value);
  const { getToken } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const token = await getToken();
        const { data } = await api.get("/api/user/may-know", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (data.success) setSuggestions(data.users);
      } catch (_) {}
    };
    fetchSuggestions();
  }, []);

  const handleFollow = async (userId) => {
    try {
      const token = await getToken();
      const { data } = await api.post(
        "/api/user/follow",
        { id: userId },
        { headers: { Authorization: `Bearer ${token}` } },
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

  if (suggestions.length === 0) return null;

  return (
    <div className="bg-card border border-border text-xs p-4 rounded-2xl shadow-sm">
      <h3 className="text-foreground font-semibold mb-3">People You May Know</h3>
      <div className="space-y-3">
        {suggestions.slice(0, 5).map((user) => (
          <div key={user._id} className="flex items-center gap-2">
            <img
              onClick={() => navigate(`/profile/${user._id}`)}
              src={user.profile_picture}
              className="size-9 rounded-full object-cover cursor-pointer flex-shrink-0"
              alt=""
            />
            <div
              onClick={() => navigate(`/profile/${user._id}`)}
              className="flex-1 min-w-0 cursor-pointer"
            >
              <p className="font-medium text-foreground truncate">{user.full_name}</p>
              <p className="text-muted truncate">@{user.username}</p>
            </div>
            <button
              onClick={() => handleFollow(user._id)}
              disabled={currentUser?.following?.includes(user._id)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-primary hover:bg-primary/10 transition disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              <UserPlus className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SuggestedConnectionsWidget;