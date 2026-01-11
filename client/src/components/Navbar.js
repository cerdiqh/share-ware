import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import our custom auth hook
import NotificationDropdown from './NotificationDropdown';

const Navbar = () => {
  const { user, logout } = useAuth(); // Get the current user and logout function
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); // Call the logout function from our context
    navigate('/login'); // Redirect to login page
  };

  return (
    <nav className="bg-gray-800 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">Share-Wear</Link>
        <div className="flex items-center gap-4">
          <Link to="/" className="hover:text-gray-300">Browse</Link>
          {user ? (
            // If a user is logged in, show this:
            <>
              <NotificationDropdown />
              <Link to="/profile" className="hover:text-gray-300">Profile</Link>
              {user.role === 'recipient' && (
                <Link to="/saved" className="hover:text-gray-300">Saved</Link>
              )}
              <span className="font-semibold">Hello, {user.fullname}</span>
              {user.role === 'donor' && (
                <Link to="/dashboard" className="hover:text-gray-300">My Dashboard</Link>
              )}
              {user.role === 'recipient' && (
                <Link to="/my-requests" className="hover:text-gray-300">My Requests</Link>
              )}
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Logout
              </button>
            </>
          ) : (
            // If no user is logged in, show this:
            <>
              <Link to="/login" className="hover:text-gray-300">Login</Link>
              <Link to="/register" className="hover:text-gray-300">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
