import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { checkAuth } from '../store/authSlice';

const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { initialized, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!initialized) {
      dispatch(checkAuth());
    }
  }, [dispatch, initialized]);

  // Show loading spinner while checking authentication
  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return children;
};

export default AuthProvider;