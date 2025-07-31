import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPosts, deletePost } from '../store/postSlice';
import { logout } from '../store/authSlice';
import { Link, useNavigate } from 'react-router-dom';
import './PostList.css';

const PostList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { posts, loading, error, deleteLoading } = useSelector((state) => state.posts);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [page, setPage] = useState(1);
  const [deletingPostId, setDeletingPostId] = useState(null);

  useEffect(() => {
    dispatch(fetchPosts(page));
  }, [dispatch, page]);

  // Handle blocked user error
  useEffect(() => {
    if (error && error.status === 403 && error.message.includes('Blocked user')) {
      alert('Your account has been blocked. You will be logged out.');
      dispatch(logout());
      navigate('/login');
    }
  }, [error, dispatch, navigate]);

  // Debug logging
  useEffect(() => {
    console.log('User object:', user);
    console.log('Is authenticated:', isAuthenticated);
    console.log('Is staff:', user?.is_staff);
  }, [user, isAuthenticated]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleDeletePost = async (postId, postAuthor) => {
    if (!isAuthenticated || (postAuthor !== user?.username && !user?.is_staff)) {
      alert('You are not authorized to delete this post');
      return;
    }

    if (window.confirm('Are you sure you want to delete this post?')) {
      setDeletingPostId(postId);
      try {
        const result = await dispatch(deletePost(postId));
        if (result.meta.requestStatus === 'fulfilled') {
          dispatch(fetchPosts(page));
        } else if (result.meta.requestStatus === 'rejected' && result.payload?.status === 403) {
          alert('You are not authorized to delete this post.');
        }
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('Error deleting post. Please try again.');
      } finally {
        setDeletingPostId(null);
      }
    }
  };

  const canEditPost = (postAuthor) => {
    return isAuthenticated && (postAuthor === user?.username || user?.is_staff);
  };

  return (
    <div className="post-list-container">
      <h2 className="post-list-title">Blog Posts</h2>
      <div className="auth-links">
        {isAuthenticated ? (
          <>
            <Link to="/create-post" className="auth-link">Create New Post</Link>
            {user?.is_staff && <Link to="/admin" className="auth-link">Admin Dashboard</Link>}
            <button onClick={handleLogout} className="logout-button">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="auth-link">Login</Link>
            <span className="separator"> | </span>
            <Link to="/register" className="auth-link">Register</Link>
          </>
        )}
      </div>

      {loading && <p className="loading">Loading...</p>}
      {error && (
        <p className="error">
          {error.status === 403 && error.message.includes('Blocked user')
            ? 'Your account has been blocked. Please contact support.'
            : `Error: ${error.message}`}
        </p>
      )}

      <div className="posts-grid">
        {posts.map((post) => (
          <div key={post.id} className="post-card">
            <div className="post-card-header">
              <h3 className="post-title">
                <Link to={`/posts/${post.id}`} className="post-title-link">
                  {post.title}
                </Link>
              </h3>
              <div className="post-author">
                <span className="author-label">By</span>
                <span className="author-name">{post.author}</span>
              </div>
            </div>

            <div className="post-card-content">
              {post.excerpt && (
                <p className="post-excerpt">{post.excerpt}</p>
              )}

              <div className="post-stats">
                <div className="stat-item">
                  <span className="stat-icon">👁️</span>
                  <span className="stat-value">{post.read_count}</span>
                  <span className="stat-label">reads</span>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">❤️</span>
                  <span className="stat-value">{post.likes_count}</span>
                  <span className="stat-label">likes</span>
                </div>
              </div>
            </div>

            <div className="post-card-footer">
              <div className="post-date">
                {post.created_at && new Date(post.created_at).toLocaleDateString()}
              </div>

              {canEditPost(post.author) && (
                <div className="post-actions">
                  <Link
                    to={`/posts/${post.id}/edit`}
                    className="action-button edit-button"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDeletePost(post.id, post.author)}
                    className="action-button delete-button"
                    disabled={deletingPostId === post.id}
                  >
                    {deletingPostId === post.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {posts.length === 0 && !loading && (
        <div className="no-posts">
          <p>No posts found. Be the first to create one!</p>
        </div>
      )}

      <div className="pagination">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          className="pagination-button"
        >
          Previous
        </button>
        <span className="page-info">Page {page}</span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={error?.status === 403 && error?.message.includes('Blocked user')}
          className="pagination-button"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default PostList;