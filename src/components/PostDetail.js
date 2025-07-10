import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPost, createComment, toggleLike } from '../store/postSlice';
import { useParams } from 'react-router-dom';
import './PostDetails.css';

const PostDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { post, loading, error } = useSelector((state) => state.posts);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [comment, setComment] = useState('');
  const [commentError, setCommentError] = useState('');

  useEffect(() => {
    dispatch(fetchPost(id));
  }, [dispatch, id]);

  const validateComment = () => {
    if (!comment.trim()) {
      setCommentError('Comment cannot be empty');
      return false;
    }
    if (comment.length > 500) {
      setCommentError('Comment must be 500 characters or less');
      return false;
    }
    setCommentError('');
    return true;
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!validateComment()) {
      return;
    }
    dispatch(createComment({ postId: id, content: comment })).then((result) => {
      if (result.meta.requestStatus === 'fulfilled') {
        setComment('');
        dispatch(fetchPost(id)); // Refresh post to update comments_count
      }
    });
  };

  const handleLike = () => {
    dispatch(toggleLike({ postId: id, isLike: true }));
  };

  const handleUnlike = () => {
    dispatch(toggleLike({ postId: id, isLike: false }));
  };

  if (loading) return <p className="loading">Loading...</p>;
  if (error) return <p className="error-message">Error: {JSON.stringify(error)}</p>;
  if (!post) return <p className="no-post">No post found</p>;

  return (
    <div className="post-detail-container">
      <h2>{post.title}</h2>
      <p className="post-meta">
        By {post.author} | {post.read_count} reads | {post.likes_count} likes
      </p>
      {post.image && <img src={post.image} alt={post.title} className="post-image" />}
      {post.file && (
        <a href={post.file} className="post-file-link">
          Download File
        </a>
      )}
      <p className="post-content">{post.content}</p>
      {isAuthenticated && (
        <div>
          <div className="action-buttons">
            <button onClick={handleLike} className="action-button like-button">
              Like
            </button>
            <button onClick={handleUnlike} className="action-button unlike-button">
              Unlike
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
      <div className="comments-section">
        <h3>Comments</h3>
        <ul className="comments-list">
          {post.comments?.filter((c) => c.is_approved).length > 0 ? (
            post.comments
              .filter((c) => c.is_approved)
              .map((comment) => (
                <li key={comment.id} className="comment-item">
                  {comment.content} by {comment.author} (
                  {new Date(comment.created_at).toLocaleString()})
                </li>
              ))
          ) : (
            <li className="comment-item">No approved comments yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default PostDetail;