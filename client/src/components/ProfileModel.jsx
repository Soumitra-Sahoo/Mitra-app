import React, { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { updateUser } from "../store/slices/userSlice.js";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";

const ProfileModel = ({ setShowEdit }) => {
  const dispatch = useDispatch();
  const { getToken } = useAuth();
  const user = useSelector((state) => state.user.value);

  const [editForm, setEditForm] = useState({
    username: user.username,
    bio: user.bio,
    location: user.location,
    profile_picture: null,
    full_name: user.full_name,
    cover_photo: null,
  });

  const [profilePreview, setProfilePreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  useEffect(() => {
    if (!editForm.profile_picture) {
      setProfilePreview(null);
      return;
    }
    const url = URL.createObjectURL(editForm.profile_picture);
    setProfilePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [editForm.profile_picture]);

  useEffect(() => {
    if (!editForm.cover_photo) {
      setCoverPreview(null);
      return;
    }
    const url = URL.createObjectURL(editForm.cover_photo);
    setCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [editForm.cover_photo]);

  const handleSaveProfile = async (e) => {
  e.preventDefault();
  const userData = new FormData();
  const {
    full_name,
    username,
    bio,
    location,
    profile_picture,
    cover_photo,
  } = editForm;

  userData.append("username", username);
  userData.append("bio", bio);
  userData.append("location", location);
  userData.append("full_name", full_name);
  profile_picture && userData.append("profile", profile_picture);
  cover_photo && userData.append("cover", cover_photo);

  const token = await getToken();
  await dispatch(updateUser({ userData, token })).unwrap();
  setShowEdit(false);
};

  return (
    <div className="fixed top-0 bottom-0 left-0 right-0 z-[110] h-screen overflow-y-scroll bg-black/50">
      <div className="max-w-2xl sm:py-6 mx-auto">
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-6">
            Edit Profile
          </h1>

          <form
            className="space-y-4"
            onSubmit={(e) =>
              toast.promise(handleSaveProfile(e), {
                loading: "Saving...",
                success: "Profile saved!",
                error: "Failed to save profile",
              })
            }
          >
            {/* Profile Picture */}
            <div className="flex flex-col items-start gap-3">
              <label
                htmlFor="profile_picture"
                className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1"
              >
                Profile Picture
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  id="profile_picture"
                  className="w-full p-3 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg"
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      profile_picture: e.target.files[0],
                    })
                  }
                />
                <div className="group/profile relative">
                  <img
                    src={profilePreview || user.profile_picture}
                    alt=""
                    className="w-24 h-24 rounded-full object-cover mt-2"
                  />

                  <div className=" absolute hidden group-hover/profile:flex top-0 left-0 right-0 bottom-0 bg-black/20 rounded-full items-center justify-center">
                    <Pencil className="size-5 text-white" />
                  </div>
                </div>
              </label>
            </div>

            {/* Cover Photo */}
            <div className="flex flex-col items-start gap-3">
              <label
                htmlFor="cover_photo"
                className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1"
              >
                Cover Photo
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  id="cover_photo"
                  className="w-full p-3 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg"
                  onChange={(e) =>
                    setEditForm({ ...editForm, cover_photo: e.target.files[0] })
                  }
                />
                <div className="group/cover relative">
                  <img
                    src={coverPreview || user.cover_photo}
                    className="w-80 h-40 rounded-lg bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 object-cover mt-2"
                    alt=""
                  />

                  <div className=" absolute hidden group-hover/cover:flex top-0 left-0 right-0 bottom-0 bg-black/20 rounded-lg items-center justify-center">
                    <Pencil className="size-5 text-white" />
                  </div>
                </div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
                Name
              </label>
              <input
                type="text"
                className="w-full p-3 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg"
                placeholder="Please enter your full name"
                onChange={(e) =>
                  setEditForm({ ...editForm, full_name: e.target.value })
                }
                value={editForm.full_name}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
                Username
              </label>
              <input
                type="text"
                className="w-full p-3 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg"
                placeholder="Please enter your username"
                onChange={(e) =>
                  setEditForm({ ...editForm, username: e.target.value })
                }
                value={editForm.username}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
                Bio
              </label>
              <textarea
                rows={3}
                className="w-full p-3 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg"
                placeholder="Please enter short bio"
                onChange={(e) =>
                  setEditForm({ ...editForm, bio: e.target.value })
                }
                value={editForm.bio}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
                Location
              </label>
              <input
                type="text"
                className="w-full p-3 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg"
                placeholder="Please enter your location"
                onChange={(e) =>
                  setEditForm({ ...editForm, location: e.target.value })
                }
                value={editForm.location}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-6">
              <button
                type="button"
                onClick={() => setShowEdit(false)}
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileModel;