import { configureStore } from '@reduxjs/toolkit'
import userReducer from './slices/userSlice.js'
import connectionsReducer from './slices/connectionSlice.js'
import messagesReducer from './slices/messagesSlice.js'


export const store = configureStore({
    reducer: {
        user: userReducer,
        connections: connectionsReducer,
        messages: messagesReducer
    }
})