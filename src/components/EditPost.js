import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchPost, updatePost } from '../store/postSlice';
import './EditPost.css';

const EditPost = () => {
  const { id } = useParams(); // Get post ID from URL
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { post, loading, updateLoading, error } = useSelector((state) => state.posts);
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch post data when component mounts
  useEffect(() => {
    // Check if ID exists before fetching
    if (!id) {
      console.error('Post ID is undefined');
      navigate('/');
      return;
    }

    console.log('Fetching post with ID:', id);
    dispatch(fetchPost({ id, incrementView: false }));
  }, [dispatch, id, navigate]);

  // Populate form when post data is loaded
  useEffect(() => {
    if (post && post.id === parseInt(id)) {
      setFormData({
        title: post.title || '',
        content: post.content || '',
        excerpt: post.excerpt || '',
        image: null
      });
      if (post.image) {
        setImagePreview(post.image);
      }
    }
  }, [post, id]);

  // Check authorization
  useEffect(() => {
    if (!isAuthenticated) {
      alert('You must be logged in to edit posts');
      navigate('/login');
      return;
    }

    if (post && post.author !== user?.username && !user?.is_staff) {
      alert('You are not authorized to edit this post');
      navigate('/');
    }
  }, [post, user, isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    setHasChanges(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        image: file
      }));
      setImagePreview(URL.createObjectURL(file));
      setHasChanges(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Title and content are required');
      return;
    }

    const postData = {
      title: formData.title.trim(),
      content: formData.content.trim(),
      excerpt: formData.excerpt.trim()
    };

    // Only include image if a new one was selected
    if (formData.image) {
      postData.image = formData.image;
    }

    try {
      const result = await dispatch(updatePost({ id: parseInt(id), postData }));
      
      if (result.meta.requestStatus === 'fulfilled') {
        alert('Post updated successfully!');
        navigate(`/posts/${id}`);
      } else if (result.meta.requestStatus === 'rejected') {
        const errorMsg = result.payload?.message || 'Failed to update post';
        alert(`Error: ${errorMsg}`);
      }
    } catch (err) {
      console.error('Error updating post:', err);
      alert('An unexpected error occurred');
    }
  };

  const handleCancel = () => {
    if (hasChanges && !window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
      return;
    }
    navigate(`/posts/${id}`);
  };

  if (loading) {
    return (
      <div className="edit-post-container">
        <div className="loading">Loading post...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="edit-post-container">
        <div className="error">
          Error loading post: {error.message || 'Unknown error'}
          <button onClick={() => navigate('/')} className="back-button">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!post || post.id !== parseInt(id)) {
    return (
      <div className="edit-post-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="edit-post-container">
      <h2>Edit Post</h2>
      
      {error && (
        <div className="error-message">
          {typeof error === 'string' ? error : JSON.stringify(error)}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="edit-post-form">
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="form-input"
            placeholder="Enter post title"
          />
        </div>

        <div className="form-group">
          <label htmlFor="content">Content *</label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            required
            className="form-textarea"
            placeholder="Enter post content"
            rows="10"
          />
        </div>

        <div className="form-group">
          <label htmlFor="image">Image (optional)</label>
          <input
            type="file"
            id="image"
            name="image"
            onChange={handleChange}
            accept="image/*"
            className="form-input"
          />
          {previewImage && (
            <div className="image-preview">
              <img src={previewImage} alt="Preview" className="preview-image" />
            </div>
          )}
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            disabled={updateLoading}
            className="submit-button"
          >
            {updateLoading ? 'Updating...' : 'Update Post'}
          </button>
          <button 
            type="button" 
            onClick={handleCancel}
            className="cancel-button"
            disabled={updateLoading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditPost;