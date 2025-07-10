import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axiosInstance from '../api/axiosInstance';
import { logout } from '../store/authSlice';
import { fetchPost } from '../store/postSlice'; // Import fetchPost action
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [users, setUsers] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !user?.is_staff) {
      navigate('/login');
    } else {
      fetchData();
    }
  }, [isAuthenticated, user, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, commentsRes] = await Promise.all([
        axiosInstance.get('/auth/users/'),
        axiosInstance.get('/posts/comments/'),
      ]);
      console.log('Users response:', usersRes.data);
      console.log('Comments response:', commentsRes.data);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.results || []);
      setComments(Array.isArray(commentsRes.data) ? commentsRes.data : commentsRes.data.results || []);
    } catch (err) {
      console.error('Fetch data error:', err.response?.data || err.message);
      setError(err.response?.data || 'Error fetching data');
    }
    setLoading(false);
  };

  const handleApproveComment = async (commentId, isApproved) => {
    try {
      await axiosInstance.post(`/posts/comments/${commentId}/approve/`, { is_approved: isApproved });
      
      // Update local state
      setComments(comments.map((c) => (c.id === commentId ? { ...c, is_approved: isApproved } : c)));
      
      // Find the comment and refresh the related post in Redux store
      const comment = comments.find(c => c.id === commentId);
      if (comment && comment.post) {
        // Refresh the post in Redux store to update comments
        dispatch(fetchPost(comment.post));
      }
      
      // Optionally refresh the comments list to get updated data
      fetchData();
      
    } catch (err) {
      console.error('Approve comment error:', err.response?.data || err.message);
      setError(err.response?.data || 'Error updating comment');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axiosInstance.delete(`/auth/users/${userId}/`);
        setUsers(users.filter((u) => u.id !== userId));
      } catch (err) {
        console.error('Delete user error:', err.response?.data || err.message);
        setError(err.response?.data || 'Error deleting user');
      }
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleBackToPosts = () => {
    navigate('/');
  };

  if (loading) return <p className="loading">Loading admin dashboard...</p>;
  if (error) return <p className="error">Error: {JSON.stringify(error)}</p>;

  return (
    <div className="admin-dashboard-container">
      <h2>Admin Dashboard</h2>
      <div className="dashboard-actions">
        <button onClick={handleBackToPosts} className="back-button">Back to Posts</button>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </div>
      
      <div className="section-card">
        <h3 style={{color:"black"}}>Users Management</h3>
        {users.length === 0 ? (
          <p className="empty-state">No users found.</p>
        ) : (
          <ul className="user-list">
            {users.map((user) => (
              <li key={user.id} className="user-item">
                <div className="user-info">
                  <div className="username">{user.username}</div>
                  <div className="email">{user.email}</div>
                  {user.is_staff && <span className="status-indicator status-approved">Staff</span>}
                  {user.is_superuser && <span className="status-indicator status-approved">Superuser</span>}
                </div>
                <div className="action-buttons">
                  <button 
                    onClick={() => handleDeleteUser(user.id)} 
                    className="delete-button"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="section-card">
        <h3>Comments Moderation</h3>
        {comments.length === 0 ? (
          <p className="empty-state">No comments found.</p>
        ) : (
          <ul className="comment-list">
            {comments.map((comment) => (
              <li key={comment.id} className="comment-item">
                <div className="comment-content">"{comment.content}"</div>
                <div className="comment-meta">
                  <span className="comment-author">by {comment.author}</span>
                  <span className="comment-post">on Post #{comment.post}</span>
                  <span className={`status-indicator ${comment.is_approved ? 'status-approved' : 'status-pending'}`}>
                    {comment.is_approved ? 'Approved' : 'Pending'}
                  </span>
                </div>
                <div className="action-buttons">
                  <button
                    onClick={() => handleApproveComment(comment.id, !comment.is_approved)}
                    className={`approve-button ${comment.is_approved ? 'blocked' : 'approved'}`}
                  >
                    {comment.is_approved ? 'Block Comment' : 'Approve Comment'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;