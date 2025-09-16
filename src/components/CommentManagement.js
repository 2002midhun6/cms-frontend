import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axiosInstance from '../api/axiosInstance';
import { logout } from '../store/authSlice';
import { fetchPost } from '../store/postSlice';
import { useNavigate } from 'react-router-dom';
import './CommentManagement.css';

const CommentManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [comments, setComments] = useState([]);
  const [commentsPagination, setCommentsPagination] = useState({ count: 0, next: null, previous: null });
  const [commentsPage, setCommentsPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processingComments, setProcessingComments] = useState(new Set());
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'approved'
  const [notification, setNotification] = useState(''); // New state for notifications

  useEffect(() => {
    if (!isAuthenticated || !user?.is_staff) {
      navigate('/login');
    } else {
      fetchComments();
    }
  }, [isAuthenticated, user, navigate, commentsPage, filter]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      let url = `/posts/comments/?page=${commentsPage}`;
      if (filter === 'pending') {
        url += '&is_approved=false';
      } else if (filter === 'approved') {
        url += '&is_approved=true';
      }
      
      const commentsRes = await axiosInstance.get(url);
      
      setComments(commentsRes.data.results || []);
      setCommentsPagination({
        count: commentsRes.data.count || 0,
        next: commentsRes.data.next,
        previous: commentsRes.data.previous,
      });
    } catch (err) {
      console.error('Fetch comments error:', err.response?.data || err.message);
      setError(err.response?.data || 'Error fetching comments');
    }
    setLoading(false);
  };

  const handleCommentAction = async (commentId, isApproved) => {
    // Add confirmation alert for approval
    if (isApproved) {
      if (!window.confirm('Are you sure you want to approve this comment?')) {
        return; // Exit if user cancels
      }
    } else {
      // Add confirmation alert for rejection as well
      if (!window.confirm('Are you sure you want to reject this comment?')) {
        return; // Exit if user cancels
      }
    }

    setProcessingComments(prev => new Set(prev).add(commentId));
    try {
      await axiosInstance.post(`/posts/comments/${commentId}/approve/`, { is_approved: isApproved });
      
      // Update local state instead of refetching
      setComments(prevComments => {
        const updatedComments = prevComments.map(c => 
          c.id === commentId ? { ...c, is_approved: isApproved } : c
        );
        
        // If current filter doesn't match the new status, remove the comment from view
        if (filter === 'pending' && isApproved) {
          return updatedComments.filter(c => c.id !== commentId);
        } else if (filter === 'approved' && !isApproved) {
          return updatedComments.filter(c => c.id !== commentId);
        }
        
        return updatedComments;
      });
      
      // Update pagination count if comment was removed from current view
      if ((filter === 'pending' && isApproved) || (filter === 'approved' && !isApproved)) {
        setCommentsPagination(prev => ({
          ...prev,
          count: Math.max(0, prev.count - 1)
        }));
      }
      
      // Refresh the post to update comment count
      const comment = comments.find(c => c.id === commentId);
      if (comment && comment.post) {
        dispatch(fetchPost(comment.post));
      }

      // Show notification
      setNotification(isApproved ? 'Comment approved!' : 'Comment rejected!');
      setTimeout(() => setNotification(''), 3000); // Clear notification after 3 seconds
      
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
        
        // Remove comment from local state
        setComments(prevComments => prevComments.filter(c => c.id !== commentId));
        
        // Update pagination count
        setCommentsPagination(prev => ({
          ...prev,
          count: Math.max(0, prev.count - 1)
        }));

        // Show notification
        setNotification('Comment deleted!');
        setTimeout(() => setNotification(''), 3000); // Clear notification after 3 seconds
        
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

  const handleBulkApprove = async () => {
    const pendingComments = comments.filter(c => !c.is_approved);
    if (pendingComments.length === 0) {
      alert('No pending comments to approve');
      return;
    }

    if (window.confirm(`Are you sure you want to approve ${pendingComments.length} pending comments?`)) {
      try {
        await Promise.all(
          pendingComments.map(comment => 
            axiosInstance.post(`/posts/comments/${comment.id}/approve/`, { is_approved: true })
          )
        );
        
        // Update local state instead of refetching
        if (filter === 'pending') {
          // If viewing pending comments, remove all approved ones from view
          setComments(prevComments => prevComments.filter(c => c.is_approved));
          setCommentsPagination(prev => ({
            ...prev,
            count: Math.max(0, prev.count - pendingComments.length)
          }));
        } else {
          // If viewing all or approved comments, update their status
          setComments(prevComments => 
            prevComments.map(c => 
              pendingComments.some(pc => pc.id === c.id) ? { ...c, is_approved: true } : c
            )
          );
        }

        // Show notification
        setNotification(`${pendingComments.length} comment${pendingComments.length > 1 ? 's' : ''} approved!`);
        setTimeout(() => setNotification(''), 3000); // Clear notification after 3 seconds
        
      } catch (err) {
        console.error('Bulk approve error:', err);
        setError('Error approving comments');
      }
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

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCommentsPage(1); // Reset to first page when filter changes
  };

  if (loading) return <p className="loading">Loading comment management...</p>;
  if (error) return <p className="error">Error: {JSON.stringify(error)}</p>;

  const pendingCount = comments.filter(c => !c.is_approved).length;
  const approvedCount = comments.filter(c => c.is_approved).length;

  return (
    <div className="comment-management-container">
      <div className="header">
        <h2>Comment Management</h2>
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
          <h3>Total Comments</h3>
          <p className="stat-number">{commentsPagination.count}</p>
        </div>
        <div className="stat-card">
          <h3>Pending</h3>
          <p className="stat-number pending">{pendingCount}</p>
        </div>
        <div className="stat-card">
          <h3>Approved</h3>
          <p className="stat-number approved">{approvedCount}</p>
        </div>
      </div>

      <div className="controls-section">
        <div className="filter-buttons">
          <button 
            onClick={() => handleFilterChange('all')} 
            className={`filter-button ${filter === 'all' ? 'active' : ''}`}
          >
            All Comments
          </button>
          <button 
            onClick={() => handleFilterChange('pending')} 
            className={`filter-button ${filter === 'pending' ? 'active' : ''}`}
          >
            Pending ({pendingCount})
          </button>
          <button 
            onClick={() => handleFilterChange('approved')} 
            className={`filter-button ${filter === 'approved' ? 'active' : ''}`}
          >
            Approved ({approvedCount})
          </button>
        </div>
        
        {pendingCount > 0 && (
          <button onClick={handleBulkApprove} className="bulk-approve-button">
            Approve All Pending ({pendingCount})
          </button>
        )}
      </div>

      <div className="section-card">
        <h3>Comments {filter !== 'all' && `(${filter})`}</h3>
        {comments.length === 0 ? (
          <p className="empty-state">No comments found for the selected filter.</p>
        ) : (
          <>
            <div className="comments-list">
              {comments.map(comment => (
                <div key={comment.id} className="comment-item">
                  <div className="comment-header">
                    <div className="comment-meta">
                      <span className="comment-author">👤 {comment.author}</span>
                      <span className="comment-post">📝 Post #{comment.post}</span>
                      <span className="comment-date">
                        📅 {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <span
                      className={`status-indicator ${comment.is_approved ? 'status-approved' : 'status-pending'}`}
                    >
                      {comment.is_approved ? '✅ Approved' : '⏳ Pending'}
                    </span>
                  </div>
                  
                  <div className="comment-content">
                    <p>"{comment.content}"</p>
                  </div>
                  
                  <div className="comment-actions">
                    {!comment.is_approved && (
                      <button
                        onClick={() => handleCommentAction(comment.id, true)}
                        className="approve-button"
                        disabled={processingComments.has(comment.id)}
                      >
                        {processingComments.has(comment.id) ? 'Processing...' : '✅ Approve'}
                      </button>
                    )}
                    {comment.is_approved && (
                      <button
                        onClick={() => handleCommentAction(comment.id, false)}
                        className="reject-button"
                        disabled={processingComments.has(comment.id)}
                      >
                        {processingComments.has(comment.id) ? 'Processing...' : '❌ Reject'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="delete-button"
                      disabled={processingComments.has(comment.id)}
                    >
                      {processingComments.has(comment.id) ? 'Processing...' : '🗑️ Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pagination-controls">
              <button
                onClick={handleCommentsPrevPage}
                disabled={!commentsPagination.previous}
                className="pagination-button"
              >
                Previous
              </button>
              <span className="page-info">
                Page {commentsPage} of {Math.ceil(commentsPagination.count / 10)}
              </span>
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

export default CommentManagement;