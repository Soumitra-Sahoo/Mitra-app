import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../api/axios.js'

const initialState = {
    connections: [],
    pendingConnections: [],
    followers: [],
    following: [],
    status: "idle",
    error: null,
}

export const fetchConnections = createAsyncThunk('connections/fetchConnections', async(token) => {
    const { data } = await api.get('/api/user/connections', {
        headers: {Authorization: `Bearer ${token}`}
    })
    return data.success ? data : null;
})

const connectionsSlice = createSlice({
    name: 'connections',
    initialState,
    reducers: {

    },
    extraReducers: (builder) => {
    builder
        .addCase(fetchConnections.pending, (state) => {
            state.status = "loading";
            state.error = null;
        })
        .addCase(fetchConnections.fulfilled, (state, action) => {
            if (action.payload) {
                state.connections = action.payload.connections;
                state.pendingConnections = action.payload.pendingConnections;
                state.followers = action.payload.followers;
                state.following = action.payload.following;
                state.status = "succeeded";
            } else {
                state.status = "failed";
                state.error = "Failed to load connections";
            }
        })
        .addCase(fetchConnections.rejected, (state, action) => {
            state.status = "failed";
            state.error = action.error.message || "Failed to load connections";
        });
}
})

export default connectionsSlice.reducer;