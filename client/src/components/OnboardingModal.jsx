import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useDispatch, useSelector } from "react-redux";
import api from "../api/axios.js";
import toast from "react-hot-toast";
import { updateUser } from "../features/user/userSlice.js";
import {
  Pencil,
  Sparkles,
  MapPin,
  FileText,
  User,
  ChevronRight,
  X,
} from "lucide-react";

const STEPS = ["welcome", "avatar", "bio", "location", "done"];

const OnboardingModal = () => {
  const { getToken } = useAuth();
  const dispatch = useDispatch();
  const currentUser = useSelector((s) => s.user.value);

  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    bio: "",
    location: "",
    profile_picture: null,
  });
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [checked, setChecked] = useState(false);

  // Check onboarding status once user is loaded
  useEffect(() => {
    if (!currentUser || checked) return;
    const check = async () => {
      try {
        const token = await getToken();
        const { data } = await api.get("/api/user/onboarding", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (data.success && data.needsOnboarding) {
          setForm((f) => ({
            ...f,
            bio: data.user.bio || "",
            location: data.user.location || "",
          }));
          setShow(true);
        }
      } catch (_) {
      } finally {
        setChecked(true);
      }
    };
    check();
  }, [currentUser]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("bio", form.bio);
      formData.append("location", form.location);
      formData.append("username", currentUser.username);
      formData.append("full_name", currentUser.full_name);
      if (form.profile_picture)
        formData.append("profile", form.profile_picture);

      const token = await getToken();
      dispatch(updateUser({ userData: formData, token }));
      setStep(STEPS.indexOf("done"));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!show) return null;

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
            style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
          />
        </div>

        <div className="p-8">
          {/* Welcome step */}
          {current === "welcome" && (
            <div className="text-center">
              <div className="size-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="size-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Welcome to Mitra! 👋
              </h2>
              <p className="text-slate-500 mb-8">
                Let's set up your profile so others can get to know you. It only
                takes a minute.
              </p>
              <button
                onClick={() => setStep(1)}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-2xl transition flex items-center justify-center gap-2"
              >
                Get Started <ChevronRight className="size-5" />
              </button>
              <button
                onClick={() => setShow(false)}
                className="mt-3 text-sm text-slate-400 hover:text-slate-600 transition w-full"
              >
                Skip for now
              </button>
            </div>
          )}

          {/* Avatar step */}
          {current === "avatar" && (
            <div className="text-center">
              <User className="size-8 text-indigo-500 mx-auto mb-2" />
              <h2 className="text-xl font-bold text-slate-900 mb-1">
                Add a profile photo
              </h2>
              <p className="text-slate-500 text-sm mb-6">
                Help people recognise you
              </p>

              <label
                htmlFor="onboard-avatar"
                className="cursor-pointer group inline-block"
              >
                <div className="relative size-28 mx-auto rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-xl ring-2 ring-indigo-200">
                  {preview ? (
                    <img
                      src={preview}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={currentUser?.profile_picture}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <Pencil className="size-5 text-white" />
                  </div>
                </div>
                <p className="text-indigo-600 text-sm font-medium mt-3">
                  Click to change
                </p>
                <input
                  type="file"
                  id="onboard-avatar"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setForm((f) => ({ ...f, profile_picture: file }));
                      setPreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </label>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setStep(step - 1)}
                  className="flex-1 py-3 border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(step + 1)}
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-2xl transition flex items-center justify-center gap-2"
                >
                  Continue <ChevronRight className="size-5" />
                </button>
              </div>
            </div>
          )}

          {/* Bio step */}
          {current === "bio" && (
            <div>
              <FileText className="size-8 text-indigo-500 mb-2" />
              <h2 className="text-xl font-bold text-slate-900 mb-1">
                Write a bio
              </h2>
              <p className="text-slate-500 text-sm mb-6">
                Tell others a bit about yourself
              </p>

              <textarea
                rows={4}
                value={form.bio}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bio: e.target.value }))
                }
                placeholder="e.g. Frontend developer. Coffee enthusiast. I love building things."
                className="w-full border border-slate-200 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
              <p className="text-xs text-slate-400 text-right mt-1">
                {form.bio.length}/150
              </p>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(step - 1)}
                  className="flex-1 py-3 border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(step + 1)}
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-2xl transition flex items-center justify-center gap-2"
                >
                  Continue <ChevronRight className="size-5" />
                </button>
              </div>
            </div>
          )}

          {/* Location step */}
          {current === "location" && (
            <div>
              <MapPin className="size-8 text-indigo-500 mb-2" />
              <h2 className="text-xl font-bold text-slate-900 mb-1">
                Where are you from?
              </h2>
              <p className="text-slate-500 text-sm mb-6">
                This helps people find you by location
              </p>

              <input
                type="text"
                value={form.location}
                onChange={(e) =>
                  setForm((f) => ({ ...f, location: e.target.value }))
                }
                placeholder="e.g. Kolkata, India"
                className="w-full border border-slate-200 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
              />

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(step - 1)}
                  className="flex-1 py-3 border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-2xl transition flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {saving ? (
                    "Saving…"
                  ) : (
                    <>
                      <Sparkles className="size-4" /> Finish Setup
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Done step */}
          {current === "done" && (
            <div className="text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                You're all set!
              </h2>
              <p className="text-slate-500 mb-8">
                Your profile is ready. Start exploring Mitra and connecting with
                people!
              </p>
              <button
                onClick={() => setShow(false)}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-2xl transition"
              >
                Start Exploring
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
