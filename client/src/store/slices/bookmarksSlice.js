import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios.js";

const initialState = {
  bookmarkedIds: [],
};

export const fetchBookmarkedIds = createAsyncThunk(
  "bookmarks/fetchBookmarkedIds",
  async (token) => {
    const { data } = await api.get("/api/bookmark/ids", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data.success ? data.postIds : [];
  },
);

const bookmarksSlice = createSlice({
  name: "bookmarks",
  initialState,
  reducers: {
    setBookmarked: (state, action) => {
      const { postId, bookmarked } = action.payload;
      if (bookmarked) {
        if (!state.bookmarkedIds.includes(postId)) {
          state.bookmarkedIds.push(postId);
        }
      } else {
        state.bookmarkedIds = state.bookmarkedIds.filter((id) => id !== postId);
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchBookmarkedIds.fulfilled, (state, action) => {
      state.bookmarkedIds = action.payload;
    });
  },
});

export const { setBookmarked } = bookmarksSlice.actions;
export default bookmarksSlice.reducer;
