import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import HomePage from './pages/HomePage';
import Header from './components/Header/Header';
import MapPage from './pages/MapPage';
import AdminPage from './pages/AdminPage';
import SignUpForm from './components/Auth/SignUpForm';
import LoginForm from './components/Auth/LoginForm';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import LeaderboardPage from './pages/LeaderboardPage';
import RequestLocationPage from './pages/RequestLocationPage';
import FriendsPage from './pages/FriendsPage';
import ProtectedRoute from './components/Auth/ProtectedRoute';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
          <Header />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route 
              path="/map" 
              element={
                <ProtectedRoute>
                  <MapPage />
                </ProtectedRoute>
              } 
            />
            <Route path="/signup" element={<SignUpForm />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route 
              path="/friends" 
              element={
                <ProtectedRoute>
                  <FriendsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/request-location" 
              element={
                <ProtectedRoute>
                  <RequestLocationPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;