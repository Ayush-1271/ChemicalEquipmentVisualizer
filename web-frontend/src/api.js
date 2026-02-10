import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:8000/api';

const client = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach Token
client.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Token ${token}`;
            console.log(`[API] ${config.method.toUpperCase()} ${config.url} (Token Present: YES)`);
        } else {
            console.log(`[API] ${config.method.toUpperCase()} ${config.url} (Token Present: NO)`);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Handle Errors (401, Network)
client.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            console.error('[API Error]', error.response.status, error.response.data);
            if (error.response.status === 401) {
                // Token invalid or expired
                localStorage.removeItem('token');
                window.location.reload(); // Force login screen
            }
        } else if (error.request) {
            console.error('[API Network Error] No response received', error.request);
        } else {
            console.error('[API Error]', error.message);
        }
        return Promise.reject(error);
    }
);

export const api = {
    login: (username, password) => client.post('/login/', { username, password }),

    uploadDataset: (file, onUploadProgress) => {
        const formData = new FormData();
        formData.append('file', file);
        return client.post('/upload/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress
        });
    },

    getHistory: () => client.get('/history/'),

    // Dataset Detail now returns { count, next, results: [records], summary: {...} }
    getDatasetDetail: (id, page = 1) => client.get(`/dataset/${id}/?page=${page}`),

    getDatasetSummary: (id) => client.get(`/dataset/${id}/summary/`),

    getDatasetReport: (id) => client.get(`/dataset/${id}/report/`, { responseType: 'blob' }),

    // User Management (Admin Only)
    getUsers: () => client.get('/users/'),
    createUser: (data) => client.post('/users/', data),
    updateUser: (id, data) => client.patch(`/users/${id}/`, data),
    deleteUser: (id) => client.delete(`/users/${id}/`),
};

export default api;
