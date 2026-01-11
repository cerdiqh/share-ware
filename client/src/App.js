import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import Layout Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';

// Import Page Components
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';
import DonorDashboard from './pages/DonorDashboard';
import RecipientDashboard from './pages/RecipientDashboard';
import ItemDetails from './pages/ItemDetails';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import SavedPage from './pages/SavedPage';
import ChatPage from './pages/ChatPage';


function App() {
  // Keep a small debug route at /_debug to verify rendering without removing app routes
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow container mx-auto px-4">
          <ErrorBoundary>
          <Routes>
            {/* Define the route for the home page */}
            <Route path="/" element={<HomePage />} />
            
            {/* Define the route for the login page */}
            <Route path="/login" element={<LoginPage />} />

            {/* Define the route for the register page */}
            <Route path="/register" element={<RegisterPage />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DonorDashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="/donations/:id" element={<ItemDetails />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/saved" element={<SavedPage />} />
            <Route path="/conversations/:id" element={<ChatPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route 
              path="/my-requests" 
              element={
                <ProtectedRoute>
                  <RecipientDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Lightweight debug route */}
            <Route path="/_debug" element={(
              <div className="p-8 text-center">
                <h2 className="text-xl font-bold">Debug route</h2>
                <p className="text-sm text-gray-600">React renders fine.</p>
              </div>
            )} />
          </Routes>
          </ErrorBoundary>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
