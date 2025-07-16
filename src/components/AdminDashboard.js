import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axiosInstance from '../api/axiosInstance';
import { logout } from '../store/authSlice';
import { fetchPost } from '../store/postSlice';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  // State for users and comments with pagination
  const [users, setUsers] = useState([]);
  const [usersPagination, setUsersPagination] = useState({ count: 0, next: null, previous: null });
  const [usersPage, setUsersPage] = useState(1);

  const [comments, setComments] = useState([]);
  const [commentsPagination, setCommentsPagination] = useState({ count: 0, next: null, previous: null });
  const [commentsPage, setCommentsPage] = useState(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processingComments, setProcessingComments] = useState(new Set());

  useEffect(() => {
    if (!isAuthenticated || !user?.is_staff) {
      navigate('/login');
    } else {
      fetchData();
    }
  }, [isAuthenticated, user, navigate, usersPage, commentsPage]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, commentsRes] = await Promise.all([
        axiosInstance.get(`/auth/users/?page=${usersPage}`),
        axiosInstance.get(`/posts/comments/?page=${commentsPage}`),
      ]);

      // Handle users response
      setUsers(usersRes.data.results || []);
      setUsersPagination({
        count: usersRes.data.count || 0,
        next: usersRes.data.next,
        previous: usersRes.data.previous,
      });

      // Handle comments response
      setComments(commentsRes.data.results || []);
      setCommentsPagination({
        count: commentsRes.data.count || 0,
        next: commentsRes.data.next,
        previous: commentsRes.data.previous,
      });
    } catch (err) {
      console.error('Fetch data error:', err.response?.data || err.message);
      setError(err.response?.data || 'Error fetching data');
    }
    setLoading(false);
  };

  const handleCommentAction = async (commentId, isApproved) => {
    setProcessingComments(prev => new Set(prev).add(commentId));
    try {
      await axiosInstance.post(`/posts/comments/${commentId}/approve/`, { is_approved: isApproved });
      setComments(comments.map(c => (c.id === commentId ? { ...c, is_approved: isApproved } : c)));
      const comment = comments.find(c => c.id === commentId);
      if (comment && comment.post) {
        dispatch(fetchPost(comment.post));
      }
      fetchData();
    } catch (err) {
      console.error('Comment action error:', err.response?.data || err.message);
      setError(err.response?.data || 'Error updating comment');
    } finally {
      setProcessingComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment permanently?')) {
      setProcessingComments(prev => new Set(prev).add(commentId));
      try {
        await axiosInstance.delete(`/posts/comments/${commentId}/`);
        setComments(comments.filter(c => c.id !== commentId));
        fetchData();
      } catch (err) {
        console.error('Delete comment error:', err.response?.data || err.message);
        setError(err.response?.data || 'Error deleting comment');
      } finally {
        setProcessingComments(prev => {
          const newSet = new Set(prev);
          newSet.delete(commentId);
          return newSet;
        });
      }
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axiosInstance.delete(`/auth/users/${userId}/`);
        setUsers(users.filter(u => u.id !== userId));
        fetchData();
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

  // Pagination handlers
  const handleUsersNextPage = () => {
    if (usersPagination.next) {
      setUsersPage(prev => prev + 1);
    }
  };

  const handleUsersPrevPage = () => {
    if (usersPagination.previous) {
      setUsersPage(prev => prev - 1);
    }
  };

  const handleCommentsNextPage = () => {
    if (commentsPagination.next) {
      setCommentsPage(prev => prev + 1);
    }
  };

  const handleCommentsPrevPage = () => {
    if (commentsPagination.previous) {
      setCommentsPage(prev => prev - 1);
    }
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
        <h3 style={{ color: 'black' }}>Users Management</h3>
        {users.length === 0 ? (
          <p className="empty-state">No users found.</p>
        ) : (
          <>
            <ul className="user-list">
              {users.map(user => (
                <li key={user.id} className="user-item">
                  <div className="user-info">
                    <div className="username">{user.username}</div>
                    <div className="email">{user.email}</div>
                    {user.is_staff && <span className="status-indicator status-approved">Staff</span>}
                    {user.is_superuser && <span className="status-indicator status-approved">Superuser</span>}
                  </div>
                  <div className="action-buttons">
                    <button onClick={() => handleDeleteUser(user.id)} className="delete-button">
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="pagination-controls">
              <button
                onClick={handleUsersPrevPage}
                disabled={!usersPagination.previous}
                className="pagination-button"
              >
                Previous
              </button>
              <span>Page {usersPage}</span>
              <button
                onClick={handleUsersNextPage}
                disabled={!usersPagination.next}
                className="pagination-button"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      <div className="section-card">
        <h3>Comments Moderation</h3>
        {comments.length === 0 ? (
          <p className="empty-state">No comments found.</p>
        ) : (
          <>
            <ul className="comment-list">
              {comments.map(comment => (
                <li key={comment.id} className="comment-item">
                  <div className="comment-content">"{comment.content}"</div>
                  <div className="comment-meta">
                    <span className="comment-author">by {comment.author}</span>
                    <span className="comment-post">on Post #{comment.post}</span>
                    <span
                      className={`status-indicator ${comment.is_approved ? 'status-approved' : 'status-pending'}`}
                    >
                      {comment.is_approved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                  <div className="action-buttons">
                    {!comment.is_approved && (
                      <button
                        onClick={() => handleCommentAction(comment.id, true)}
                        className="approve-button"
                        disabled={processingComments.has(comment.id)}
                      >
                        {processingComments.has(comment.id) ? 'Processing...' : 'Approve'}
                      </button>
                    )}
                    {comment.is_approved && (
                      <button
                        onClick={() => handleCommentAction(comment.id, false)}
                        className="reject-button"
                        disabled={processingComments.has(comment.id)}
                      >
                        {processingComments.has(comment.id) ? 'Processing...' : 'Reject'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="delete-button"
                      disabled={processingComments.has(comment.id)}
                    >
                      {processingComments.has(comment.id) ? 'Processing...' : 'Delete'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="pagination-controls">
              <button
                onClick={handleCommentsPrevPage}
                disabled={!commentsPagination.previous}
                className="pagination-button"
              >
                Previous
              </button>
              <span>Page {commentsPage}</span>
              <button
                onClick={handleCommentsNextPage}
                disabled={!commentsPagination.next}
                className="pagination-button"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;