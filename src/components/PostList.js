import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPosts } from '../store/postSlice';
import { logout } from '../store/authSlice';
import { Link } from 'react-router-dom';
import './PostList.css';

const PostList = () => {
  const dispatch = useDispatch();
  const { posts, loading, error } = useSelector((state) => state.posts);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [page, setPage] = useState(1);

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
            <Link to={`/posts/${post.id}`} className="post-link">
              {post.title} by {post.author} ({post.read_count} reads, {post.likes_count} likes)
            </Link>
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