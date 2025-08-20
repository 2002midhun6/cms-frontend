import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axiosInstance from '../api/axiosInstance';
import { logout } from '../store/authSlice';
import { useNavigate } from 'react-router-dom';
import './UserManagement.css';

const UserManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [users, setUsers] = useState([]);
  const [usersPagination, setUsersPagination] = useState({ count: 0, next: null, previous: null });
  const [usersPage, setUsersPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processingUsers, setProcessingUsers] = useState(new Set());
  const [notification, setNotification] = useState(''); // New state for notifications

  useEffect(() => {
    if (!isAuthenticated || !user?.is_staff) {
      navigate('/login');
    } else {
      fetchUsers();
    }
  }, [isAuthenticated, user, navigate, usersPage]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersRes = await axiosInstance.get(`/auth/users/?page=${usersPage}`);
      setUsers(usersRes.data.results || []);
      setUsersPagination({
        count: usersRes.data.count || 0,
        next: usersRes.data.next,
        previous: usersRes.data.previous,
      });
    } catch (err) {
      console.error('Fetch users error:', err.response?.data || err.message);
      setError(err.response?.data || 'Error fetching users');
    }
    setLoading(false);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      setProcessingUsers(prev => new Set(prev).add(userId));
      try {
        await axiosInstance.delete(`/auth/users/${userId}/`);
        setUsers(users.filter(u => u.id !== userId));
        fetchUsers();
      } catch (err) {
        console.error('Delete user error:', err.response?.data || err.message);
        setError(err.response?.data || 'Error deleting user');
      } finally {
        setProcessingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      }
    }
  };

  const handleToggleStaffStatus = async (userId, currentStatus) => {
    setProcessingUsers(prev => new Set(prev).add(userId));
    try {
      await axiosInstance.patch(`/auth/users/${userId}/`, { is_staff: !currentStatus });
      setUsers(users.map(u => (u.id === userId ? { ...u, is_staff: !currentStatus } : u)));
    } catch (err) {
      console.error('Toggle staff status error:', err.response?.data || err.message);
      setError(err.response?.data || 'Error updating user status');
    } finally {
      setProcessingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleToggleBlockStatus = async (userId, currentStatus) => {
    setProcessingUsers(prev => new Set(prev).add(userId));
    try {
      await axiosInstance.patch(`/auth/users/${userId}/`, { is_blocked: !currentStatus });
      setUsers(users.map(u => (u.id === userId ? { ...u, is_blocked: !currentStatus } : u)));
      setNotification(currentStatus ? 'User unblocked!' : 'User blocked!');
      setTimeout(() => setNotification(''), 3000); // Clear notification after 3 seconds
    } catch (err) {
      console.error('Toggle block status error:', err.response?.data || err.message);
      setError(err.response?.data || 'Error updating user block status');
    } finally {
      setProcessingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleBackToAdmin = () => {
    navigate('/admin');
  };

  const handleBackToPosts = () => {
    navigate('/');
  };

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

  if (loading) return <p className="loading">Loading user management...</p>;
  if (error) return <p className="error">Error: {JSON.stringify(error)}</p>;

  return (
    <div className="user-management-container">
      <div className="header">
        <h2>User Management</h2>
        <div className="header-actions">
          <button onClick={handleBackToAdmin} className="back-button">Back to Admin</button>
          <button onClick={handleBackToPosts} className="back-button">Back to Posts</button>
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
      </div>

      {notification && (
        <div className="notification">
          {notification}
        </div>
      )}

      <div className="stats-section">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p className="stat-number">{usersPagination.count}</p>
        </div>
        <div className="stat-card">
          <h3>Staff Users</h3>
          <p className="stat-number">{users.filter(u => u.is_staff).length}</p>
        </div>
        <div className="stat-card">
          <h3>Blocked Users</h3>
          <p className="stat-number">{users.filter(u => u.is_blocked).length}</p>
        </div>
      </div>

      <div className="section-card">
        <h3>All Users</h3>
        {users.length === 0 ? (
          <p className="empty-state">No users found.</p>
        ) : (
          <>
            <div className="users-table">
              <div className="table-header">
                <span>Username</span>
                <span>Email</span>
                <span>Status</span>
                <span>Actions</span>
              </div>
              {users.map(userItem => (
                <div key={userItem.id} className="table-row">
                  <div className="user-info">
                    <div className="username">{userItem.username}</div>
                  </div>
                  <div className="email">{userItem.email}</div>
                  <div className="status-badges">
                    {userItem.is_staff && <span className="status-badge staff">Staff</span>}
                    {userItem.is_superuser && <span className="status-badge superuser">Superuser</span>}
                    {userItem.is_blocked && <span className="status-badge blocked">Blocked</span>}
                    {!userItem.is_staff && !userItem.is_superuser && !userItem.is_blocked && (
                      <span className="status-badge regular">Regular</span>
                    )}
                  </div>
                  <div className="action-buttons">
                    <button
                      onClick={() => handleToggleStaffStatus(userItem.id, userItem.is_staff)}
                      className={`toggle-button ${userItem.is_staff ? 'remove-staff' : 'make-staff'}`}
                      disabled={processingUsers.has(userItem.id)}
                    >
                      {processingUsers.has(userItem.id)
                        ? 'Processing...'
                        : userItem.is_staff
                          ? 'Remove Staff'
                          : 'Make Staff'}
                    </button>
                    {userItem.id !== user.id && (
                      <button
                        onClick={() => handleToggleBlockStatus(userItem.id, userItem.is_blocked)}
                        className={`toggle-button ${userItem.is_blocked ? 'unblock-user' : 'block-user'}`}
                        disabled={processingUsers.has(userItem.id)}
                      >
                        {processingUsers.has(userItem.id)
                          ? 'Processing...'
                          : userItem.is_blocked
                            ? 'Unblock'
                            : 'Block'}
                      </button>
                    )}
                    {userItem.id !== user.id && (
                      <button
                        onClick={() => handleDeleteUser(userItem.id)}
                        className="delete-button"
                        disabled={processingUsers.has(userItem.id)}
                      >
                        {processingUsers.has(userItem.id) ? 'Deleting...' : 'Delete'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="pagination-controls">
              <button
                onClick={handleUsersPrevPage}
                disabled={!usersPagination.previous}
                className="pagination-button"
              >
                Previous
              </button>
              <span className="page-info">
                Page {usersPage} of {Math.ceil(usersPagination.count / 10)}
              </span>
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
    </div>
  );
};

export default UserManagement;