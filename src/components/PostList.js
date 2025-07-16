import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPosts, deletePost } from '../store/postSlice';
import { logout } from '../store/authSlice';
import { Link } from 'react-router-dom';
import './PostList.css';

const PostList = () => {
  const dispatch = useDispatch();
  const { posts, loading, error, deleteLoading } = useSelector((state) => state.posts);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [page, setPage] = useState(1);
  const [deletingPostId, setDeletingPostId] = useState(null);

  useEffect(() => {
    dispatch(fetchPosts(page));
  }, [dispatch, page]);

  // Debug logging
  useEffect(() => {
    console.log('User object:', user);
    console.log('Is authenticated:', isAuthenticated);
    console.log('Is staff:', user?.is_staff);
  }, [user, isAuthenticated]);

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleDeletePost = async (postId, postAuthor) => {
    // Check if user can delete this post
    if (!isAuthenticated || (postAuthor !== user?.username && !user?.is_staff)) {
      alert('You are not authorized to delete this post');
      return;
    }

    if (window.confirm('Are you sure you want to delete this post?')) {
      setDeletingPostId(postId);
      try {
        const result = await dispatch(deletePost(postId));
        if (result.meta.requestStatus === 'fulfilled') {
          // Refresh the posts list
          dispatch(fetchPosts(page));
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
      {error && <p className="error">Error: {JSON.stringify(error)}</p>}
      
      <ul className="post-list">
        {posts.map((post) => (
          <li key={post.id} className="post-item">
            <div className="post-item-content">
              <Link to={`/posts/${post.id}`} className="post-link">
                {post.title} by {post.author} ({post.read_count} reads, {post.likes_count} likes)
              </Link>
              
              {canEditPost(post.author) && (
                <div className="post-item-actions">
                  <Link 
                    to={`/posts/${post.id}/edit`} 
                    className="edit-link"
                  >
                    Edit
                  </Link>
                  <button 
                    onClick={() => handleDeletePost(post.id, post.author)}
                    className="delete-link"
                    disabled={deletingPostId === post.id}
                  >
                    {deletingPostId === post.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
      
      <div className="pagination">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          className="pagination-button"
        >
          Previous
        </button>
        <button
          onClick={() => setPage(page + 1)}
          className="pagination-button"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default PostList;