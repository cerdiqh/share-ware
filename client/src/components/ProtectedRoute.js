import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// This component will act as a guard for our private pages
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth(); // Get the current user from our context

  // If there is no user logged in...
  if (!user) {
    // ...redirect them to the login page.
    return <Navigate to="/login" />;
  }

  // If there IS a user, render the children components (the actual page they wanted to see).
  return children;
};

export default ProtectedRoute;
