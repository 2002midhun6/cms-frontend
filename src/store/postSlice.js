import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../api/axiosInstance';

export const fetchPosts = createAsyncThunk(
  'posts/fetchPosts',
  async (page = 1, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/posts/?page=${page}`);
      return response.data;
    } catch (error) {
      return rejectWithValue({
        status: error.response?.status,
        message: error.response?.data?.detail || error.message,
      });
    }
  }
);

export const fetchPost = createAsyncThunk(
  'posts/fetchPost',
  async ({ id, incrementView = false }, { rejectWithValue }) => {
    try {
      const url = incrementView 
        ? `/posts/${id}/?increment_view=true` 
        : `/posts/${id}/`;
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      return rejectWithValue({
        status: error.response?.status,
        message: error.response?.data?.detail || error.message,
      });
    }
  }
);

export const createPost = createAsyncThunk(
  'posts/createPost',
  async (postData, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      Object.keys(postData).forEach((key) => formData.append(key, postData[key]));
      const response = await axiosInstance.post('/posts/', formData);
      return response.data;
    } catch (error) {
      return rejectWithValue({
        status: error.response?.status,
        message: error.response?.data?.detail || error.message,
      });
    }
  }
);

export const updatePost = createAsyncThunk(
  'posts/updatePost',
  async ({ id, postData }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      Object.keys(postData).forEach((key) => formData.append(key, postData[key]));
      const response = await axiosInstance.put(`/posts/${id}/`, formData);
      return response.data;
    } catch (error) {
      return rejectWithValue({
        status: error.response?.status,
        message: error.response?.data?.detail || error.message,
      });
    }
  }
);

export const deletePost = createAsyncThunk(
  'posts/deletePost',
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/posts/${id}/`);
      return id;
    } catch (error) {
      return rejectWithValue({
        status: error.response?.status,
        message: error.response?.data?.detail || error.message,
      });
    }
  }
);

export const updateComment = createAsyncThunk(
  'posts/updateComment',
  async ({ commentId, content, postId }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/posts/comments/${commentId}/`, {
        content: content.trim(),
      });
      return { ...response.data, postId };
    } catch (error) {
      console.error('Update comment error:', error.response?.data);
      return rejectWithValue({
        status: error.response?.status,
        message: error.response?.data?.detail || error.message,
      });
    }
  }
);

export const createComment = createAsyncThunk(
  'posts/createComment',
  async ({ postId, content }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/posts/comments/', { post: postId, content });
      return response.data;
    } catch (error) {
      return rejectWithValue({
        status: error.response?.status,
        message: error.response?.data?.detail || error.message,
      });
    }
  }
);

export const deleteComment = createAsyncThunk(
  'posts/deleteComment',
  async ({ commentId, postId }, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/posts/comments/${commentId}/`);
      return { commentId, postId };
    } catch (error) {
      return rejectWithValue({
        status: error.response?.status,
        message: error.response?.data?.detail || error.message,
      });
    }
  }
);

export const toggleLike = createAsyncThunk(
  'posts/toggleLike',
  async ({ postId, isLike }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/posts/${postId}/like/`, { is_like: isLike });
      return { postId, isLike };
    } catch (error) {
      return rejectWithValue({
        status: error.response?.status,
        message: error.response?.data?.detail || error.message,
      });
    }
  }
);

const postSlice = createSlice({
  name: 'posts',
  initialState: {
    posts: [],
    post: null,
    loading: false,
    error: null,
    updateLoading: false,
    deleteLoading: false,
    deleteCommentLoading: false,
    updateCommentLoading: false,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.posts = action.payload.results || action.payload;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchPost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPost.fulfilled, (state, action) => {
        state.loading = false;
        state.post = action.payload;
      })
      .addCase(fetchPost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.posts.unshift(action.payload);
      })
      .addCase(createComment.fulfilled, (state, action) => {
        if (state.post) {
          state.post.comments_count += 1;
        }
      })
      .addCase(updatePost.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updatePost.fulfilled, (state, action) => {
        state.updateLoading = false;
        const index = state.posts.findIndex((post) => post.id === action.payload.id);
        if (index !== -1) {
          state.posts[index] = action.payload;
        }
        if (state.post && state.post.id === action.payload.id) {
          state.post = action.payload;
        }
      })
      .addCase(updatePost.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload;
      })
      .addCase(deletePost.pending, (state) => {
        state.deleteLoading = true;
        state.error = null;
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.posts = state.posts.filter((post) => post.id !== action.payload);
        if (state.post && state.post.id === action.payload) {
          state.post = null;
        }
      })
      .addCase(deletePost.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.payload;
      })
      .addCase(updateComment.pending, (state) => {
        state.updateCommentLoading = true;
        state.error = null;
      })
      .addCase(updateComment.fulfilled, (state, action) => {
        state.updateCommentLoading = false;
        const { postId, ...updatedComment } = action.payload;
        if (state.post && state.post.id === postId) {
          const commentIndex = state.post.comments.findIndex(
            (comment) => comment.id === updatedComment.id
          );
          if (commentIndex !== -1) {
            state.post.comments[commentIndex] = updatedComment;
          }
        }
        const postIndex = state.posts.findIndex((post) => post.id === postId);
        if (postIndex !== -1 && state.posts[postIndex].comments) {
          const commentIndex = state.posts[postIndex].comments.findIndex(
            (comment) => comment.id === updatedComment.id
          );
          if (commentIndex !== -1) {
            state.posts[postIndex].comments[commentIndex] = updatedComment;
          }
        }
      })
      .addCase(updateComment.rejected, (state, action) => {
        state.updateCommentLoading = false;
        state.error = action.payload;
      })
      .addCase(deleteComment.pending, (state) => {
        state.deleteCommentLoading = true;
        state.error = null;
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        state.deleteCommentLoading = false;
        const { commentId, postId } = action.payload;
        if (state.post && state.post.id === postId) {
          state.post.comments = state.post.comments.filter(
            (comment) => comment.id !== commentId
          );
          state.post.comments_count = Math.max(0, state.post.comments_count - 1);
        }
        const postIndex = state.posts.findIndex((post) => post.id === postId);
        if (postIndex !== -1) {
          state.posts[postIndex].comments = state.posts[postIndex].comments?.filter(
            (comment) => comment.id !== commentId
          ) || [];
          state.posts[postIndex].comments_count = Math.max(
            0,
            (state.posts[postIndex].comments_count || 0) - 1
          );
        }
      })
      .addCase(deleteComment.rejected, (state, action) => {
        state.deleteCommentLoading = false;
        state.error = action.payload;
      })
      .addCase(toggleLike.fulfilled, (state, action) => {
        const { postId, isLike } = action.payload;
        if (state.post && state.post.id === postId) {
          state.post.likes_count = isLike
            ? state.post.likes_count + 1
            : Math.max(0, state.post.likes_count - 1);
        }
      });
  },
});

export const { clearError } = postSlice.actions;
export default postSlice.reducer;