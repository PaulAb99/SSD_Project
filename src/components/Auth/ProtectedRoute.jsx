import React from 'react';
import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { isDark } = useTheme();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      Swal.fire({
        title: 'Authentication Required',
        text: 'You need to be logged in to access the map.',
        icon: 'info',
        showCancelButton: false,
        confirmButtonColor: '#6f4e35',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Go to Login',
        cancelButtonText: 'Cancel',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#ffffff' : '#000000'
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/login');
        } else {
          navigate('/');
        }
      });
    }
  }, [user, loading, isDark]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-heritage-700 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return children;
}

export default ProtectedRoute;
