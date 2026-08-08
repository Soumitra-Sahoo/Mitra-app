import React, { useEffect, useState, useCallback, useRef } from "react";
import { Search, Flame, Users, UserPlus } from "lucide-react";
import UserCard from "../components/UserCard";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios.js";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { fetchUser } from "../store/slices/userSlice.js";

const UserCardSkeleton = () => (
  <div className="w-full sm:w-[320px] p-5 bg-card/80 border border-border rounded-3xl shadow-lg animate-pulse">
    <div className="flex flex-col items-center gap-3">
      <div className="w-20 h-20 rounded-full bg-border" />
      <div className="w-32 h-4 bg-border rounded" />
      <div className="w-24 h-3 bg-surface rounded" />
      <div className="w-48 h-3 bg-surface rounded" />
    </div>
    <div className="flex gap-2 mt-4">
      <div className="flex-1 h-10 bg-border rounded-xl" />
      <div className="w-14 h-10 bg-surface rounded-xl" />
    </div>
  </div>
);

const Discover = () => {
  const dispatch = useDispatch();
  const { getToken } = useAuth();

  const [input, setInput] = useState("");
  const [users, setUsers] = useState([]);
  const [mayKnow, setMayKnow] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mkLoading, setMkLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const debounceRef = useRef(null);

  const doSearch = useCallback(
    async (query) => {
      setLoading(true);
      setHasSearched(true);
      try {
        const token = await getToken();
        const { data } = await api.post(
          "/api/user/discover",
          { input: query },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (data.success) setUsers(data.users);
        else toast.error(data.message);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    },
    [getToken],
  );

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 350);
  };

  const fetchMayKnow = async () => {
    setMkLoading(true);
    try {
      const token = await getToken();
      const { data } = await api.get("/api/user/may-know", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) setMayKnow(data.users);
    } catch (_) {
    } finally {
      setMkLoading(false);
    }
  };

  useEffect(() => {
    getToken().then((token) => dispatch(fetchUser(token)));
    doSearch("");
    fetchMayKnow();
    return () => clearTimeout(debounceRef.current);
  }, []);

  const showMayKnow = !input && mayKnow.length > 0;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <div className="p-6 pb-4 bg-background z-20 transition-theme">
        <div className="mb-6">
          <h1 className="flex items-center gap-3 text-3xl font-bold text-foreground mb-2">
            <UserPlus className="size-7 shrink-0" />
            <span>Discover People</span>
          </h1>
          <p className="text-foreground-secondary">Connect with people and grow your network</p>
        </div>

        <div className="shadow-md rounded-2xl border border-border bg-card/90 backdrop-blur-md">
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted size-5" />
              <input
                type="text"
                onChange={handleInputChange}
                value={input}
                className="pl-12 w-full py-3 border border-border bg-transparent text-foreground rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm"
                placeholder="Search by name, username, bio or location…"
              />
              {loading && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 size-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-10 space-y-10">
        {showMayKnow && (
          <section>
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4 sticky top-0 bg-background/90 backdrop-blur-md py-2 z-10">
              <Users className="text-primary size-5" /> People You May Know
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {mkLoading
                ? Array(3).fill(0).map((_, i) => <UserCardSkeleton key={i} />)
                : mayKnow.map((u) => <UserCard key={u._id} user={u} />)}
            </div>
          </section>
        )}

        <section>
          {!input && !loading && users.length > 0 && (
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4 sticky top-0 bg-background/90 backdrop-blur-md py-2 z-10">
              <Flame className="text-secondary-accent fill-secondary-accent size-5" />
              Trending Users
              <span className="ml-auto text-sm font-normal text-muted">{users.length} people</span>
            </h2>
          )}
          {input && hasSearched && !loading && (
            <h2 className="text-xl font-semibold text-foreground mb-4">
              {users.length > 0
                ? `${users.length} result${users.length > 1 ? "s" : ""} for "${input}"`
                : `No results for "${input}"`}
            </h2>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {loading
              ? Array(6).fill(0).map((_, i) => <UserCardSkeleton key={i} />)
              : users.map((u) => <UserCard key={u._id} user={u} />)}
          </div>

          {!loading && users.length === 0 && hasSearched && input && (
            <div className="flex flex-col items-center justify-center mt-20 text-center">
              <Search className="size-12 text-border mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-1">No users found</h2>
              <p className="text-muted">Try a different name or username</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Discover;