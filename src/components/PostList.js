import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPosts, deletePost } from '../store/postSlice';
import { logout } from '../store/authSlice';
import { Link, useNavigate } from 'react-router-dom';
import './PostList.css';

// Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button onClick={onClose} className="modal-close" aria-label="Close">
            &times;
          </button>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-footer">
          <button
            onClick={onClose}
            className="modal-button cancel-button"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="modal-button confirm-button"
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Notification Toast Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`}>
      <span>{message}</span>
      <button onClick={onClose} className="toast-close" aria-label="Close">
        &times;
      </button>
    </div>
  );
};

const PostList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { posts, loading, error, deleteLoading } = useSelector((state) => state.posts);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [page, setPage] = useState(1);
  const [deletingPostId, setDeletingPostId] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [totalPages, setTotalPages] = useState(null);
  const [pageError, setPageError] = useState(false);
  
  // Modal and Toast state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchPostsData = async () => {
      setPageError(false);
      try {
        const result = await dispatch(fetchPosts(page));
        
        if (result.meta.requestStatus === 'fulfilled') {
          const data = result.payload;
          
          if (data.results) {
            setHasNextPage(!!data.next);
            if (data.count && data.results.length > 0) {
              const postsPerPage = data.results.length;
              setTotalPages(Math.ceil(data.count / postsPerPage));
            }
          } else {
            const expectedPageSize = 10;
            setHasNextPage(data.length >= expectedPageSize);
          }
        } else if (result.meta.requestStatus === 'rejected') {
          if (result.payload?.status === 404 || result.payload?.message?.includes('Invalid page')) {
            setPageError(true);
            setHasNextPage(false);
            if (page > 1) {
              setPage(page - 1);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
        setPageError(true);
      }
    };

    fetchPostsData();
  }, [dispatch, page]);

  // Handle blocked user error
  useEffect(() => {
    if (error && error.status === 403 && error.message.includes('Blocked user')) {
      setToast({
        message: 'Your account has been blocked. You will be logged out.',
        type: 'error'
      });
      setTimeout(() => {
        dispatch(logout());
        navigate('/login');
      }, 2000);
    }
  }, [error, dispatch, navigate]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const initiateDeletePost = (postId, postAuthor) => {
    if (!isAuthenticated || (postAuthor !== user?.username && !user?.is_staff)) {
      showToast('You are not authorized to delete this post', 'error');
      return;
    }

    setPostToDelete({ id: postId, author: postAuthor });
    setShowDeleteModal(true);
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;

    setDeletingPostId(postToDelete.id);
    try {
      const result = await dispatch(deletePost(postToDelete.id));
      if (result.meta.requestStatus === 'fulfilled') {
        showToast('Post deleted successfully', 'success');
        setShowDeleteModal(false);
        
        // Refresh current page, but if it becomes empty and we're not on page 1, go to previous page
        const remainingPosts = posts.length - 1;
        if (remainingPosts === 0 && page > 1) {
          setPage(page - 1);
        } else {
          dispatch(fetchPosts(page));
        }
      } else if (result.meta.requestStatus === 'rejected' && result.payload?.status === 403) {
        showToast('You are not authorized to delete this post', 'error');
        setShowDeleteModal(false);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      showToast('Error deleting post. Please try again.', 'error');
      setShowDeleteModal(false);
    } finally {
      setDeletingPostId(null);
      setPostToDelete(null);
    }
  };

  const canEditPost = (postAuthor) => {
    return isAuthenticated && (postAuthor === user?.username || user?.is_staff);
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
      setPageError(false);
    }
  };

  const handleNextPage = () => {
    if (hasNextPage && !pageError) {
      setPage(page + 1);
    }
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
      {error && !pageError && (
        <p className="error">
          {error.status === 403 && error.message.includes('Blocked user')
            ? 'Your account has been blocked. Please contact support.'
            : `Error: ${error.message}`}
        </p>
      )}
      {pageError && (
        <p className="error">
          You've reached the end of the posts. Redirecting to the last available page.
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
                    onClick={() => initiateDeletePost(post.id, post.author)}
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

      {posts.length === 0 && !loading && !pageError && (
        <div className="no-posts">
          <p>No posts found. Be the first to create one!</p>
        </div>
      )}

      <div className="pagination">
        <button
          onClick={handlePrevPage}
          disabled={page === 1 || loading}
          className="pagination-button"
        >
          Previous
        </button>
        <span className="page-info">
          Page {page}
          {totalPages && ` of ${totalPages}`}
        </span>
        <button
          onClick={handleNextPage}
          disabled={!hasNextPage || loading || pageError || (error?.status === 403 && error?.message.includes('Blocked user'))}
          className="pagination-button"
        >
          Next
        </button>
      </div>

      {!hasNextPage && page > 1 && posts.length > 0 && (
        <div className="pagination-info">
          <p>You've reached the end of the posts.</p>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setPostToDelete(null);
        }}
        onConfirm={handleDeletePost}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        isLoading={deletingPostId !== null}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default PostList;