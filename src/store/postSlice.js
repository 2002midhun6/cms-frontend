import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../api/axiosInstance';

export const fetchPosts = createAsyncThunk('posts/fetchPosts', async (page = 1) => {
  const response = await axiosInstance.get(`/posts/?page=${page}`);
  return response.data;
});

export const fetchPost = createAsyncThunk('posts/fetchPost', async (id) => {
  const response = await axiosInstance.get(`/posts/${id}/`);
  return response.data;
});

export const createPost = createAsyncThunk('posts/createPost', async (postData) => {
  const formData = new FormData();
  Object.keys(postData).forEach((key) => formData.append(key, postData[key]));
  const response = await axiosInstance.post('/posts/', formData);
  return response.data;
});

export const createComment = createAsyncThunk('posts/createComment', async ({ postId, content }) => {
  const response = await axiosInstance.post('/posts/comments/', { post: postId, content });
  return response.data;
});

export const toggleLike = createAsyncThunk('posts/toggleLike', async ({ postId, isLike }) => {
  const response = await axiosInstance.post(`/posts/${postId}/like/`, { is_like: isLike });
  return { postId, isLike };
});

const postSlice = createSlice({
  name: 'posts',
  initialState: {
    posts: [],
    post: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.posts = action.payload.results;
      })
      .addCase(fetchPost.fulfilled, (state, action) => {
        state.loading = false;
        state.post = action.payload;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.posts.unshift(action.payload);
      })
      .addCase(createComment.fulfilled, (state, action) => {
        if (state.post) {
          state.post.comments_count += 1;
        }
      });
  },
});

export default postSlice.reducer;