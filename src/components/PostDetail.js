import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPost, createComment, updateComment, toggleLike, deletePost, deleteComment } from '../store/postSlice';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './PostDetails.css';

const PostDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { post, loading, error, deleteLoading, deleteCommentLoading, updateCommentLoading } = useSelector((state) => state.posts);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [comment, setComment] = useState('');
  const [commentError, setCommentError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCommentDeleteConfirm, setShowCommentDeleteConfirm] = useState(null);
  const [showCommentSubmitConfirm, setShowCommentSubmitConfirm] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const [editCommentError, setEditCommentError] = useState('');
  const [notification, setNotification] = useState('');
  const [likeLoading, setLikeLoading] = useState(false);
  
  // Local state to track if user has liked the post
  const [hasLiked, setHasLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [initialLikeState, setInitialLikeState] = useState(null);

  useEffect(() => {
    dispatch(fetchPost(id));
  }, [dispatch, id]);

  // Update local like state when post data changes
  useEffect(() => {
    if (post && user) {
      setLikesCount(post.likes_count || 0);
      
      // Check if backend provides likers array
      if (post.likers && Array.isArray(post.likers)) {
        const userHasLiked = post.likers.includes(user.id);
        setHasLiked(userHasLiked);
        setInitialLikeState(userHasLiked);
      } else if (initialLikeState === null) {
        // If no likers array and we haven't set initial state, assume not liked
        setHasLiked(false);
        setInitialLikeState(false);
      }
      // If we already have an initial state, keep the current hasLiked value
    }
  }, [post, user, initialLikeState]);

  const validateComment = (content) => {
    if (!content.trim()) {
      return 'Comment cannot be empty';
    }
    if (content.length > 500) {
      return 'Comment must be 500 characters or less';
    }
    return '';
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    const error = validateComment(comment);
    if (error) {
      setCommentError(error);
      return;
    }
    setCommentError('');
    setShowCommentSubmitConfirm(true);
  };

  const handleCommentSubmitConfirm = () => {
    setShowCommentSubmitConfirm(false);
    dispatch(createComment({ postId: id, content: comment })).then((result) => {
      if (result.meta.requestStatus === 'fulfilled') {
        setComment('');
        dispatch(fetchPost(id));
        setNotification('Comment added!');
        setTimeout(() => setNotification(''), 3000);
      } else {
        setNotification('Failed to add comment!');
        setTimeout(() => setNotification(''), 3000);
      }
    });
  };

  const handleCommentSubmitCancel = () => {
    setShowCommentSubmitConfirm(false);
  };

  const handleEditComment = (commentId, currentContent) => {
    setEditingCommentId(commentId);
    setEditingCommentContent(currentContent);
    setEditCommentError('');
  };

  const handleUpdateComment = (e) => {
    e.preventDefault();
    const error = validateComment(editingCommentContent);
    if (error) {
      setEditCommentError(error);
      return;
    }
    setEditCommentError('');
    dispatch(updateComment({
      commentId: editingCommentId,
      content: editingCommentContent,
      postId: parseInt(id)
    })).then((result) => {
      if (result.meta.requestStatus === 'fulfilled') {
        setEditingCommentId(null);
        setEditingCommentContent('');
      }
    });
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingCommentContent('');
    setEditCommentError('');
  };

  const handleLike = async () => {
    if (likeLoading) return;
    
    setLikeLoading(true);
    
    try {
      const result = await dispatch(toggleLike({ postId: id, isLike: true }));
      if (result.meta.requestStatus === 'fulfilled') {
        // Update local state immediately for better UX
        setHasLiked(true);
        setLikesCount(prev => prev + 1);
        
        setNotification('You liked the post!');
        setTimeout(() => setNotification(''), 3000);
        
        // Refresh post data to sync with backend
        await dispatch(fetchPost(id));
      } else {
        setNotification('Failed to like the post!');
        setTimeout(() => setNotification(''), 3000);
      }
    } catch (error) {
      console.error('Error liking post:', error);
      setNotification('Error liking the post!');
      setTimeout(() => setNotification(''), 3000);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleUnlike = async () => {
    if (likeLoading) return;
    
    setLikeLoading(true);
    
    try {
      const result = await dispatch(toggleLike({ postId: id, isLike: false }));
      if (result.meta.requestStatus === 'fulfilled') {
        // Update local state immediately for better UX
        setHasLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
        
        setNotification('You unliked the post!');
        setTimeout(() => setNotification(''), 3000);
        
        // Refresh post data to sync with backend
        await dispatch(fetchPost(id));
      } else {
        setNotification('Failed to unlike the post!');
        setTimeout(() => setNotification(''), 3000);
      }
    } catch (error) {
      console.error('Error unliking post:', error);
      setNotification('Error unliking the post!');
      setTimeout(() => setNotification(''), 3000);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const result = await dispatch(deletePost(id));
      if (result.meta.requestStatus === 'fulfilled') {
        navigate('/posts');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
    setShowDeleteConfirm(false);
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  const handleCommentDeleteClick = (commentId) => {
    setShowCommentDeleteConfirm(commentId);
  };

  const handleCommentDeleteConfirm = async () => {
    try {
      const result = await dispatch(deleteComment({
        commentId: showCommentDeleteConfirm,
        postId: parseInt(id)
      }));
      if (result.meta.requestStatus === 'fulfilled') {
        dispatch(fetchPost(id));
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
    setShowCommentDeleteConfirm(null);
  };

  const handleCommentDeleteCancel = () => {
    setShowCommentDeleteConfirm(null);
  };

  const canEditPost = isAuthenticated && post && (post.author === user?.username || user?.is_staff);

  const canDeleteComment = (commentAuthor) => {
    return isAuthenticated && (commentAuthor === user?.username || user?.is_staff);
  };

  const canEditComment = (commentAuthor) => {
    return isAuthenticated && (commentAuthor === user?.username || user?.is_staff);
  };

  if (loading) return <p className="loading">Loading...</p>;
  if (error) return <p className="error-message">Error: {JSON.stringify(error)}</p>;
  if (!post) return <p className="no-post">No post found</p>;

  return (
    <div className="post-detail-container">
      <div className="post-header">
        <h2>{post.title}</h2>
        {canEditPost && (
          <div className="post-actions">
            <Link to={`/posts/${id}/edit`} className="edit-button">
              Edit
            </Link>
            <button
              onClick={handleDeleteClick}
              className="delete-button"
              disabled={deleteLoading}
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        )}
      </div>

      <p className="post-meta">
        By {post.author} | {post.read_count} reads | {likesCount} likes
      </p>

      {post.image && <img src={post.image} alt={post.title} className="post-image" />}
      {post.file && (
        <a href={post.file} className="post-file-link">
          Download File
        </a>
      )}

      <div className="post-content">
        {post.content.split('\n').map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      {isAuthenticated && (
        <div>
          <div className="action-buttons">
            <button
              onClick={handleToggleLike}
              className={`action-button ${hasLiked ? 'liked' : 'not-liked'}`}
              disabled={likeLoading}
            >
              {likeLoading 
                ? (hasLiked ? 'Unliking...' : 'Liking...') 
                : (hasLiked ? '❤️ Liked' : '🤍 Like')
              }
            </button>
          </div>
          <form onSubmit={handleCommentSubmit} className="comment-form">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment"
              className={`comment-textarea ${commentError ? 'error' : ''}`}
            />
            {commentError && <p className="error">{commentError}</p>}
            <button type="submit" className="submit-button" disabled={loading}>
              Submit Comment
            </button>
          </form>
        </div>
      )}

      {notification && (
        <div className="notification">
          {notification}
        </div>
      )}

      <div className="comments-section">
        <h3>Comments</h3>
        <ul className="comments-list">
          {post.comments?.filter((c) => c.is_approved).length > 0 ? (
            post.comments
              .filter((c) => c.is_approved)
              .map((comment) => (
                <li key={comment.id} className="comment-item">
                  <div className="comment-content">
                    {editingCommentId === comment.id ? (
                      <form onSubmit={handleUpdateComment} className="edit-comment-form">
                        <textarea
                          value={editingCommentContent}
                          onChange={(e) => setEditingCommentContent(e.target.value)}
                          className={`edit-comment-textarea ${editCommentError ? 'error' : ''}`}
                        />
                        {editCommentError && <p className="error">{editCommentError}</p>}
                        <div className="edit-comment-actions">
                          <button
                            type="submit"
                            className="save-comment-button"
                            disabled={updateCommentLoading}
                          >
                            {updateCommentLoading ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="cancel-edit-button"
                            disabled={updateCommentLoading}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="comment-text">
                          {comment.content}
                        </div>
                        <div className="comment-meta">
                          by {comment.author} ({new Date(comment.created_at).toLocaleString()})
                        </div>
                      </>
                    )}
                  </div>
                  {editingCommentId !== comment.id && (
                    <div className="comment-actions">
                      {canEditComment(comment.author) && (
                        <button
                          onClick={() => handleEditComment(comment.id, comment.content)}
                          className="edit-comment-button"
                          disabled={updateCommentLoading}
                        >
                          Edit
                        </button>
                      )}
                      {canDeleteComment(comment.author) && (
                        <button
                          onClick={() => handleCommentDeleteClick(comment.id)}
                          className="delete-comment-button"
                          disabled={deleteCommentLoading}
                        >
                          {deleteCommentLoading && showCommentDeleteConfirm === comment.id ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
                    </div>
                  )}
                </li>
              ))
          ) : (
            <li className="comment-item">No approved comments yet.</li>
          )}
        </ul>
      </div>

      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this post? This action cannot be undone.</p>
            <div className="modal-actions">
              <button
                onClick={handleDeleteConfirm}
                className="confirm-delete-button"
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                onClick={handleDeleteCancel}
                className="cancel-button"
                disabled={deleteLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showCommentDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Delete Comment</h3>
            <p>Are you sure you want to delete this comment? This action cannot be undone.</p>
            <div className="modal-actions">
              <button
                onClick={handleCommentDeleteConfirm}
                className="confirm-delete-button"
                disabled={deleteCommentLoading}
              >
                {deleteCommentLoading ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                onClick={handleCommentDeleteCancel}
                className="cancel-button"
                disabled={deleteCommentLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showCommentSubmitConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Submit Comment</h3>
            <p>Are you sure you want to submit this comment?</p>
            <div className="comment-preview">
              <strong>Your comment:</strong>
              <p>"{comment}"</p>
            </div>
            <div className="modal-actions">
              <button
                onClick={handleCommentSubmitConfirm}
                className="confirm-submit-button"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Yes, Submit'}
              </button>
              <button
                onClick={handleCommentSubmitCancel}
                className="cancel-button"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostDetail;