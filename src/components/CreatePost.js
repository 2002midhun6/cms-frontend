import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createPost } from '../store/postSlice';
import { useNavigate } from 'react-router-dom';
import './CreatePost.css';

const CreatePost = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  
  const [errors, setErrors] = useState({});
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.posts);
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    
    // Title validation
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters long';
    } else if (title.length > 100) {
      newErrors.title = 'Title must be 100 characters or less';
    }

    // Content validation
    if (!content.trim()) {
      newErrors.content = 'Content is required';
    } else if (content.trim().length < 10) {
      newErrors.content = 'Content must be at least 10 characters long';
    } else if (content.length > 2000) {
      newErrors.content = 'Content must be 2000 characters or less';
    }

    // Image validation
    if (image) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(image.type)) {
        newErrors.image = 'Only JPEG, PNG, or GIF images are allowed';
      }
      if (image.size > 5 * 1024 * 1024) { // 5MB limit
        newErrors.image = 'Image size must be less than 5MB';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Real-time validation function
  const validateField = (field, value) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'title':
        if (!value.trim()) {
          newErrors.title = 'Title is required';
        } else if (value.trim().length < 3) {
          newErrors.title = 'Title must be at least 3 characters long';
        } else if (value.length > 100) {
          newErrors.title = 'Title must be 100 characters or less';
        } else {
          delete newErrors.title;
        }
        break;
      
      case 'content':
        if (!value.trim()) {
          newErrors.content = 'Content is required';
        } else if (value.trim().length < 10) {
          newErrors.content = 'Content must be at least 10 characters long';
        } else if (value.length > 2000) {
          newErrors.content = 'Content must be 2000 characters or less';
        } else {
          delete newErrors.content;
        }
        break;
    }
    
    setErrors(newErrors);
  };

  const handleTitleChange = (e) => {
    const value = e.target.value;
    setTitle(value);
    validateField('title', value);
  };

  const handleContentChange = (e) => {
    const value = e.target.value;
    setContent(value);
    validateField('content', value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const formData = { title, content };
    if (image) formData.image = image;
    
    dispatch(createPost(formData)).then((result) => {
      if (result.meta.requestStatus === 'fulfilled') {
        navigate('/');
      }
    });
  };

  return (
    <div className="container">
      <h2>Create Post</h2>
      {error && <p className="error-message">{JSON.stringify(error)}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
          style={{color:"black"}}
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Title"
            className={errors.title ? 'error' : ''}
          />
          <small className="char-count">{title.length}/100</small>
          {errors.title && <p className="error">{errors.title}</p>}
        </div>
        <div className="form-group">
          <textarea
           style={{color:"black"}}
            value={content}
            onChange={handleContentChange}
            placeholder="Content"
            className={errors.content ? 'error' : ''}
          />
          <small className="char-count">{content.length}/2000</small>
          {errors.content && <p className="error">{errors.content}</p>}
        </div>
        <div className="form-group">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
          />
          {errors.image && <p className="error">{errors.image}</p>}
        </div>
        
        <button type="submit" disabled={loading || Object.keys(errors).length > 0}>
          {loading ? 'Creating...' : 'Create Post'}
        </button>
      </form>
    </div>
  );
};

export default CreatePost;