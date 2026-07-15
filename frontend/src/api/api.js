import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Attach JWT token to every request if available
API.interceptors.request.use((config) => {
  const user = localStorage.getItem('travelverse_user');
  if (user) {
    const parsed = JSON.parse(user);
    config.headers.Authorization = `Bearer ${parsed.token}`;
  }
  return config;
});

// Auth
export const register = (data) => API.post('/auth/register', data);
export const login = (data) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');

// Posts
export const getAllPosts = (category) =>
  API.get('/posts', { params: category ? { category } : {} });
export const getPostById = (id) => API.get(`/posts/${id}`);
export const createPost = (data) => API.post('/posts', data);
export const updatePost = (id, data) => API.put(`/posts/${id}`, data);
export const deletePost = (id) => API.delete(`/posts/${id}`);
export const likePost = (id) => API.put(`/posts/${id}/like`);
export const getMyPosts = () => API.get('/posts/my-posts');

// Users
export const getAllUsers = () => API.get('/users');
export const getUserById = (id) => API.get(`/users/${id}`);
export const updateProfile = (data) => API.put('/users/profile', data);
export const deleteUser = (id) => API.delete(`/users/${id}`);

export default API;
