import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { register } from '../store/authSlice';
import { useNavigate } from 'react-router-dom';
import './Register.css';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [errors, setErrors] = useState({});
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 1;
    return strength;
  };

  const validateForm = () => {
    const newErrors = {};

    // Username validation: 3-20 characters, must contain at least one letter, allows alphanumeric and underscores
    if (!username) {
      newErrors.username = 'Username is required';
    } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      newErrors.username = 'Username must be 3-20 characters, using letters, numbers, or underscores';
    } else if (!/[a-zA-Z]/.test(username)) {
      newErrors.username = 'Username must contain at least one letter';
    }

    // Email validation: basic email format
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    // Password validation: at least 8 characters, one uppercase, one lowercase, one number, one special character
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[!@#$%^&*(),.?":{}|<>]/.test(password)
    ) {
      newErrors.password = 'Password must be at least 8 characters and include an uppercase letter, lowercase letter, number, and special character';
    }

    // Bio is optional, but limit to 200 characters
    if (bio && bio.length > 200) {
      newErrors.bio = 'Bio cannot exceed 200 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      dispatch(register({ username, email, password, bio })).then((result) => {
        if (result.meta.requestStatus === 'fulfilled') {
          navigate('/login');
        }
      });
    }
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthText = passwordStrength === 5 ? 'Strong' : passwordStrength >= 3 ? 'Moderate' : 'Weak';
  const strengthColor = passwordStrength === 5 ? 'bg-green-500' : passwordStrength >= 3 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="register-container max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="register-title text-2xl font-bold text-center mb-6">Create Your Account</h2>
      <div className="register-form space-y-4">
        <div className="form-group">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className={`form-input w-full p-2 border rounded ${errors.username ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.username && <p className="error-message text-red-500 text-sm mt-1">{errors.username}</p>}
        </div>
        <div className="form-group">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className={`form-input w-full p-2 border rounded ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.email && <p className="error-message text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>
        <div className="form-group">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className={`form-input w-full p-2 border rounded ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.password && <p className="error-message text-red-500 text-sm mt-1">{errors.password}</p>}
          {password && (
            <div className="password-strength mt-2">
              <div className={`h-2 rounded ${strengthColor}`} style={{ width: `${(passwordStrength / 5) * 100}%` }}></div>
              <p className="text-sm mt-1">Password Strength: {strengthText}</p>
            </div>
          )}
        </div>
        <div className="form-group">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Bio (optional)"
            className={`form-textarea w-full p-2 border rounded ${errors.bio ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.bio && <p className="error-message text-red-500 text-sm mt-1">{errors.bio}</p>}
        </div>
        <button
          type="submit"
          disabled={loading}
          onClick={handleSubmit}
          className={`submit-button w-full p-2 rounded text-white ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
        {error && <p className="error-message server-error text-red-500 text-sm mt-2">Error: {JSON.stringify(error)}</p>}
      </div>
      <p className="login-link text-center mt-4">
        Already have an account? <a href="/login" className="text-blue-500 hover:underline">Login</a>
      </p>
    </div>
  );
};

export default Register;