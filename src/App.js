import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { checkAuth } from './store/authSlice';
import Login from './components/Login';
import Register from './components/Register';
import PostList from './components/PostList';
import PostDetail from './components/PostDetail';
import CreatePost from './components/CreatePost';
import AdminDashboard from './components/AdminDashboard';
import UserManagement from './components/UserManagement';
import CommentManagement from './components/CommentManagement';
import ProtectedRoute from './components/ProtectedRoute';
import EditPost from './components/EditPost';

function App() {
  const dispatch = useDispatch();
  const { initialized } = useSelector((state) => state.auth);

  useEffect(() => {
   
    dispatch(checkAuth());
  }, [dispatch]);

  
  if (!initialized) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <PostList />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/posts/:id" 
          element={
            <ProtectedRoute>
              <PostDetail />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/posts/:id/edit" 
          element={
            <ProtectedRoute>
              <EditPost />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/create-post" 
          element={
            <ProtectedRoute>
              <CreatePost />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/users" 
          element={
            <ProtectedRoute>
              <UserManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/comments" 
          element={
            <ProtectedRoute>
              <CommentManagement />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </div>
  );
}

export default App;