import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../store/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const { error } = useSelector((state) => state.auth);

  const validateForm = () => {
    const newErrors = {};

    
    if (!username.trim()) {
      newErrors.username = 'Username is required';
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (username.length > 20) {
      newErrors.username = 'Username must be 20 characters or less';
    } 
    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 3) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (password.length > 50) {
      newErrors.password = 'Password must be 50 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    
    setErrors((prev) => ({ ...prev, login: null }));

    console.log('Login submitting:', { username, password });
    dispatch(login({ username, password })).then((result) => {
      console.log('Login result:', result);
      if (result.meta.requestStatus === 'fulfilled') {
        navigate('/');
      } else if (result.meta.requestStatus === 'rejected') {
        const errorMessage = result.payload?.error || 'An error occurred during login';
        console.log('Login error:', errorMessage); 
        if (errorMessage === 'This account is blocked') {
          alert('Your account is blocked. Please contact support.');
          setErrors((prev) => ({
            ...prev,
            login: 'Your account is blocked. Please contact support.',
          }));
           navigate('/');
        } else {
          setErrors((prev) => ({
            ...prev,
            login: errorMessage,
          }));
        }
      }
    });
  };

  return (
    
    <div className="login-container">
      <h2>Login to Your Account</h2>
      {errors.login && <p className="error">{errors.login}</p>}
      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className={`input-field ${errors.username ? 'error' : ''}`}
          />
          {errors.username && <p className="error">{errors.username}</p>}
        </div>
        <div className="form-group">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className={`input-field ${errors.password ? 'error' : ''}`}
          />
          {errors.password && <p className="error">{errors.password}</p>}
        </div>
        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <div className="register-link">
        <p>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
        
      </div>
    </div>
  );
};

export default Login;