import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchPost, updatePost, clearError } from '../store/postSlice';
import './EditPost.css';

const EditPost = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { post, updateLoading, error } = useSelector((state) => state.posts);
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image: null,
  });
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    dispatch(fetchPost(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (post) {
      // Check if user is authorized to edit this post
      if (!isAuthenticated || (post.author !== user?.username && !user?.is_staff)) {
        navigate('/posts');
        return;
      }
      
      setFormData({
        title: post.title,
        content: post.content,
        image: null, // Don't pre-populate image field
      });
      
      // Set preview image if post has existing image
      if (post.image) {
        setPreviewImage(post.image);
      }
    }
  }, [post, isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      const file = files[0];
      setFormData(prev => ({ ...prev, image: file }));
      
      // Create preview URL
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewImage(reader.result);
        };
        reader.readAsDataURL(file);
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    const updateData = {
      title: formData.title.trim(),
      content: formData.content.trim(),
    };

    // Only include image if a new one was selected
    if (formData.image) {
      updateData.image = formData.image;
    }

    try {
      const result = await dispatch(updatePost({ id, postData: updateData }));
      if (result.meta.requestStatus === 'fulfilled') {
        navigate(`/posts/${id}`);
      }
    } catch (error) {
      console.error('Error updating post:', error);
    }
  };

  const handleCancel = () => {
    navigate(`/`);
  };

  if (!isAuthenticated) {
    return <div className="error-message">Please log in to edit posts.</div>;
  }

  if (!post) {
    return <div className="loading">Loading post...</div>;
  }

  if (post.author !== user?.username && !user?.is_staff) {
    return <div className="error-message">You are not authorized to edit this post.</div>;
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