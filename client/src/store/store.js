import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice.js";
import connectionsReducer from "./slices/connectionSlice.js";
import messagesReducer from "./slices/messagesSlice.js";
import bookmarksReducer from "./slices/bookmarksSlice.js";

export const store = configureStore({
  reducer: {
    user: userReducer,
    connections: connectionsReducer,
    messages: messagesReducer,
    bookmarks: bookmarksReducer,
  },
});