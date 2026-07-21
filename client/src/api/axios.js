import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL
})
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const serverMessage = error.response?.data?.message;
        if (serverMessage) {
            error.message = serverMessage;
        }
        return Promise.reject(error);
    },
);

export default api;