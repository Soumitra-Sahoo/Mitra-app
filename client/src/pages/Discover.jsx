import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import UserCard from "../components/UserCard";
import Loading from "../components/Loading";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios.js";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { fetchUser } from "../features/user/userSlice.js";

const Discover = () => {
  const dispatch = useDispatch();

  const [input, setInput] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const { getToken } = useAuth();

  // Search Users
  const handleSearch = async (e) => {
    if (e.key === "Enter") {
      try {
        setLoading(true);

        const token = await getToken();

        const { data } = await api.post(
          "/api/user/discover",
          { input },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (data.success) {
          setUsers(data.users);
        } else {
          toast.error(data.message);
        }

        setLoading(false);
      } catch (error) {
        toast.error(error.message);
        setLoading(false);
      }
    }
  };

  // Fetch Trending Users
  const fetchTrendingUsers = async () => {
    try {
      setLoading(true);

      const token = await getToken();

      const { data } = await api.post(
        "/api/user/discover",
        { input: "" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (data.success) {
        setUsers(data.users);
      }

      setLoading(false);
    } catch (error) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    getToken().then((token) => {
      dispatch(fetchUser(token));
    });

    fetchTrendingUsers();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto p-6">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Discover People
          </h1>

          <p className="text-slate-600">
            Connect with people and grow your network
          </p>
        </div>

        {/* Search */}
        <div className="sticky top-0 z-20 mb-10 shadow-md rounded-xl border border-slate-200/60 bg-white/90 backdrop-blur-md">
          <div className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 size-5" />

              <input
                type="text"
                onChange={(e) => setInput(e.target.value)}
                value={input}
                onKeyUp={handleSearch}
                className="pl-10 sm:pl-12 w-full py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 max-sm:text-sm"
                placeholder="Search people by name, username, bio or location..."
              />
            </div>
          </div>
        </div>

        {/* Trending Users */}
        {users.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-slate-900">
               Trending Users
              </h2>

              <p className="text-sm text-slate-500">
                {users.length} people found
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {users.slice(0, 6).map((user) => (
                <UserCard key={user._id} user={user} />
              ))}
            </div>
          </>
        )}

        {/* No Users */}
        {!loading && users.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-20 text-center">
            <h2 className="text-2xl font-semibold text-slate-700 mb-2">
              No users found
            </h2>

            <p className="text-slate-500">
              Try searching with another name or username
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && <Loading height="60vh" />}
      </div>
    </div>
  );
};

export default Discover;
