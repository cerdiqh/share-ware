import React, { createContext, useContext, useState, useEffect } from 'react';

// 1. Create the context
const AuthContext = createContext(null);

// 2. Create the AuthProvider component
export const AuthProvider = ({ children }) => {
  // The user state will hold the logged-in user's info, or null if logged out
  const [user, setUser] = useState(null);

  // 3. Check localStorage when the app first starts
  useEffect(() => {
    // Try to get user info from the browser's local storage
    const userInfoFromStorage = localStorage.getItem('userInfo');
    if (userInfoFromStorage) {
      // If found, parse it and normalize role before setting
      const parsed = JSON.parse(userInfoFromStorage);
      if (parsed && parsed.role) parsed.role = parsed.role.toString().trim().toLowerCase();
      setUser(parsed);
    }
  }, []); // The empty array [] means this effect runs only once on component mount

  // 4. Login function
  const login = (userData) => {
    // Normalize role to avoid casing/whitespace issues that affect redirects
    if (userData && userData.role) {
      userData.role = userData.role.toString().trim().toLowerCase();
    }
    localStorage.setItem('userInfo', JSON.stringify(userData));
    setUser(userData);
  };

  // 5. Logout function
  const logout = () => {
    localStorage.removeItem('userInfo');
    setUser(null);
  };

  // 6. Provide the user state and functions to all children components
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// 7. Create a custom hook for easy access to the context
export const useAuth = () => {
  return useContext(AuthContext);
};
