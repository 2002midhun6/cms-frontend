import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axiosInstance from '../api/axiosInstance';
import { logout } from '../store/authSlice';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalComments: 0,
    pendingComments: 0,
    approvedComments: 0,
    totalPosts: 0,
    staffUsers: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !user?.is_staff) {
      navigate('/login');
    } else {
      fetchStats();
    }
  }, [isAuthenticated, user, navigate]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [usersRes, commentsRes, postsRes] = await Promise.all([
        axiosInstance.get('/auth/users/'),
        axiosInstance.get('/posts/comments/'),
        axiosInstance.get('/posts/')
      ]);

      const users = usersRes.data.results || [];
      const comments = commentsRes.data.results || [];
      const posts = postsRes.data.results || [];

      setStats({
        totalUsers: usersRes.data.count || 0,
        totalComments: commentsRes.data.count || 0,
        pendingComments: comments.filter(c => !c.is_approved).length,
        approvedComments: comments.filter(c => c.is_approved).length,
        totalPosts: postsRes.data.count || 0,
        staffUsers: users.filter(u => u.is_staff).length
      });
    } catch (err) {
      console.error('Fetch stats error:', err.response?.data || err.message);
      setError(err.response?.data || 'Error fetching dashboard stats');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleBackToPosts = () => {
    navigate('/');
  };

  const handleNavigateToUsers = () => {
    navigate('/admin/users');
  };

  const handleNavigateToComments = () => {
    navigate('/admin/comments');
  };

  if (loading) return <p className="loading">Loading admin dashboard...</p>;
  if (error) return <p className="error">Error: {JSON.stringify(error)}</p>;

  return (
    <div className="admin-dashboard-container">
      <div className="header">
        <h2>Admin Dashboard</h2>
        <div className="header-actions">
          <button onClick={handleBackToPosts} className="back-button">Back to Posts</button>
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
      </div>

      <div className="welcome-section">
        <h3>Welcome, {user?.username}!</h3>
        <p>Manage your blog's users, comments, and content from this dashboard.</p>
      </div>

      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>Total Users</h3>
            <p className="stat-number">{stats.totalUsers}</p>
            <p className="stat-detail">{stats.staffUsers} staff members</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">💬</div>
          <div className="stat-info">
            <h3>Comments</h3>
            <p className="stat-number">{stats.totalComments}</p>
            <p className="stat-detail pending">{stats.pendingComments} pending approval</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-info">
            <h3>Total Posts</h3>
            <p className="stat-number">{stats.totalPosts}</p>
            <p className="stat-detail">Published articles</p>
          </div>
        </div>
      </div>

      <div className="management-cards">
        <div className="management-card" onClick={handleNavigateToUsers}>
          <div className="card-header">
            <div className="card-icon">👥</div>
            <h3>User Management</h3>
          </div>
          <div className="card-content">
            <p>Manage user accounts, permissions, and roles</p>
            <ul>
              <li>View all registered users</li>
              <li>Grant or revoke staff privileges</li>
              <li>Delete user accounts</li>
              <li>Monitor user activity</li>
            </ul>
          </div>
          <div className="card-footer">
            <button className="card-button">Manage Users →</button>
          </div>
        </div>

        <div className="management-card" onClick={handleNavigateToComments}>
          <div className="card-header">
            <div className="card-icon">💬</div>
            <h3>Comment Management</h3>
          </div>
          <div className="card-content">
            <p>Moderate comments and maintain content quality</p>
            <ul>
              <li>Approve or reject comments</li>
              <li>Delete inappropriate content</li>
              <li>Filter by approval status</li>
              <li>Bulk approve pending comments</li>
            </ul>
          </div>
          <div className="card-footer">
            <button className="card-button">
              Manage Comments 
              {stats.pendingComments > 0 && (
                <span className="notification-badge">{stats.pendingComments}</span>
              )}
              →
            </button>
          </div>
        </div>
      </div>

      {stats.pendingComments > 0 && (
        <div className="alert-section">
          <div className="alert">
            <div className="alert-icon">⚠️</div>
            <div className="alert-content">
              <h4>Attention Required</h4>
              <p>You have {stats.pendingComments} comments waiting for approval.</p>
            </div>
            <button onClick={handleNavigateToComments} className="alert-button">
              Review Comments
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;