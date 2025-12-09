import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Map, Settings, LogOut, User, Trophy, Moon, Sun, Menu, X, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import useMapStore from '../../stores/mapStore';
import LanguageSelector from '../Map/LanguageSelector';
import { t, translateAllUI } from '../../utils/uiTranslations';
import Swal from 'sweetalert2';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isDark, toggleDarkMode } = useTheme();
  const currentLanguage = useMapStore((state) => state.currentLanguage);
  const setCurrentLanguage = useMapStore((state) => state.setCurrentLanguage);
  const [translatingUI, setTranslatingUI] = useState(false);

  const handleLanguageChange = async (newLanguage) => {
    if (newLanguage === currentLanguage) return;
    
    // Show loading popup
    Swal.fire({
      title: 'Translating...',
      html: `
        <div class="flex flex-col items-center gap-4 py-4">
          <div class="animate-spin rounded-full h-16 w-16 border-4 border-heritage-200 border-t-heritage-700"></div>
          <p class="text-sm ${isDark ? 'text-neutral-300' : 'text-neutral-600'}">Please wait while we translate the interface...</p>
        </div>
      `,
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      background: isDark ? '#1f2937' : '#ffffff',
      color: isDark ? '#f3f4f6' : '#000000',
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    setTranslatingUI(true);
    try {
      if (newLanguage !== 'en') {
        await translateAllUI(newLanguage);
      }
      setCurrentLanguage(newLanguage);
      
      // Close loading popup and show success
      Swal.fire({
        title: 'Translation Complete!',
        icon: 'success',
        timer: 1000,
        showConfirmButton: false,
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#000000'
      });
    } catch (error) {
      console.error('Failed to change language:', error);
      await Swal.fire({
        title: 'Translation Error',
        text: 'Failed to translate the interface. Please try again.',
        icon: 'error',
        confirmButtonColor: '#6f4e35',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#000000'
      });
    } finally {
      setTranslatingUI(false);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    const result = await Swal.fire({
      title: t('header.signOut', currentLanguage),
      text: 'Are you sure you want to sign out?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#6f4e35',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, sign out',
      background: isDark ? '#1f2937' : '#ffffff',
      color: isDark ? '#f3f4f6' : '#000000'
    });

    if (result.isConfirmed) {
      const { success, error } = await signOut();
      
      if (success) {
        await Swal.fire({
          title: 'Signed Out',
          text: 'You have been successfully signed out.',
          icon: 'success',
          confirmButtonColor: '#6f4e35',
          timer: 1500,
          background: isDark ? '#1f2937' : '#ffffff',
          color: isDark ? '#f3f4f6' : '#000000'
        });
      } else {
        await Swal.fire({
          title: t('common.error', currentLanguage),
          text: error || 'Failed to sign out. Please try again.',
          icon: 'error',
          confirmButtonColor: '#6f4e35',
          background: isDark ? '#1f2937' : '#ffffff',
          color: isDark ? '#f3f4f6' : '#000000'
        });
      }
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/95 dark:bg-neutral-800/95 backdrop-blur-sm border-b border-neutral-200 dark:border-neutral-700 z-[1000]">
      <div className="px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-heritage-700 rounded-lg flex items-center justify-center">
            <Map className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-neutral-900 dark:text-white">Echoes</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4">
          {/* Language Selector */}
          <div className={translatingUI ? 'opacity-50 pointer-events-none' : ''}>
            <LanguageSelector
              currentLanguage={currentLanguage}
              onLanguageChange={handleLanguageChange}
            />
          </div>
          
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg text-heritage-700 dark:text-heritage-300 hover:bg-heritage-50 dark:hover:bg-neutral-700 transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          
          <Link
            to="/leaderboard"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              location.pathname === '/leaderboard'
                ? 'bg-heritage-100 dark:bg-heritage-800 text-heritage-700 dark:text-heritage-300'
                : 'text-heritage-700 dark:text-heritage-300 hover:bg-heritage-50 dark:hover:bg-neutral-700'
            }`}
          >
            <Trophy className="w-5 h-5" />
            <span className="font-medium">{t('header.leaderboard', currentLanguage)}</span>
          </Link>

          {user && (
            <Link
              to="/friends"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                location.pathname === '/friends'
                  ? 'bg-heritage-100 dark:bg-heritage-800 text-heritage-700 dark:text-heritage-300'
                  : 'text-heritage-700 dark:text-heritage-300 hover:bg-heritage-50 dark:hover:bg-neutral-700'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="font-medium">{t('header.friends', currentLanguage)}</span>
            </Link>
          )}
          
          {user && (
            <>
              <div 
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 text-sm cursor-pointer hover:bg-heritage-50 dark:hover:bg-neutral-700 px-3 py-2 rounded-lg transition-colors"
              >
                <User className="w-4 h-4 text-heritage-700 dark:text-heritage-300" />
                <span className="text-heritage-700 dark:text-heritage-300 font-medium">
                  {profile?.username || 'User'}
                </span>
              </div>
              {profile?.is_admin && (
                <Link
                  to="/admin"
                  className={`p-2 rounded-lg transition-colors ${
                    location.pathname === '/admin'
                      ? 'bg-heritage-100 dark:bg-heritage-800 text-heritage-700 dark:text-heritage-300'
                      : 'text-heritage-700 dark:text-heritage-300 hover:bg-heritage-50 dark:hover:bg-neutral-700'
                  }`}
                  aria-label={t('header.admin', currentLanguage)}
                >
                  <Settings className="w-5 h-5" />
                </Link>
              )}
              <button
                onClick={handleSignOut}
                className="p-2 rounded-lg text-heritage-700 dark:text-heritage-300 hover:bg-heritage-50 dark:hover:bg-neutral-700 transition-colors"
                aria-label={t('header.signOut', currentLanguage)}
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          )}
          {!user && (
          <Link
            to="/login"
            className="bg-heritage-700 hover:bg-heritage-800 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm"
          >
            {t('header.login', currentLanguage)}
          </Link>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMobileMenu}
          className="md:hidden p-2 rounded-lg text-heritage-700 dark:text-heritage-300 hover:bg-heritage-50 dark:hover:bg-neutral-700 transition-colors"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="md:hidden border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 overflow-hidden"
          >
            <nav className="flex flex-col gap-2 px-4 py-4">
              {/* Language Selector */}
              <div className={`pb-2 border-b border-neutral-200 dark:border-neutral-700 ${translatingUI ? 'opacity-50 pointer-events-none' : ''}`}>
                <LanguageSelector
                  currentLanguage={currentLanguage}
                  onLanguageChange={handleLanguageChange}
                  isMobile={true}
                />
              </div>
            
            <button
              onClick={() => {
                toggleDarkMode();
                closeMobileMenu();
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-heritage-700 dark:text-heritage-300 hover:bg-heritage-50 dark:hover:bg-neutral-700 transition-colors"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span className="font-medium">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            
            <Link
              to="/leaderboard"
              onClick={closeMobileMenu}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                location.pathname === '/leaderboard'
                  ? 'bg-heritage-100 dark:bg-heritage-800 text-heritage-700 dark:text-heritage-300'
                  : 'text-heritage-700 dark:text-heritage-300 hover:bg-heritage-50 dark:hover:bg-neutral-700'
              }`}
            >
              <Trophy className="w-5 h-5" />
              <span className="font-medium">Leaderboard</span>
            </Link>

            {user && (
              <Link
                to="/friends"
                onClick={closeMobileMenu}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  location.pathname === '/friends'
                    ? 'bg-heritage-100 dark:bg-heritage-800 text-heritage-700 dark:text-heritage-300'
                    : 'text-heritage-700 dark:text-heritage-300 hover:bg-heritage-50 dark:hover:bg-neutral-700'
                }`}
              >
                <Users className="w-5 h-5" />
                <span className="font-medium">{t('header.friends', currentLanguage)}</span>
              </Link>
            )}
            
            {user && (
              <>
                <div 
                  onClick={() => {
                    navigate('/profile');
                    closeMobileMenu();
                  }}
                  className="flex items-center gap-2 text-sm cursor-pointer hover:bg-heritage-50 dark:hover:bg-neutral-700 px-3 py-2 rounded-lg transition-colors"
                >
                  <User className="w-4 h-4 text-heritage-700 dark:text-heritage-300" />
                  <span className="text-heritage-700 dark:text-heritage-300 font-medium">
                    {profile?.username || 'User'}
                  </span>
                </div>
                {profile?.is_admin && (
                  <Link
                    to="/admin"
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      location.pathname === '/admin'
                        ? 'bg-heritage-100 dark:bg-heritage-800 text-heritage-700 dark:text-heritage-300'
                        : 'text-heritage-700 dark:text-heritage-300 hover:bg-heritage-50 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <Settings className="w-5 h-5" />
                    <span className="font-medium">Admin Panel</span>
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleSignOut();
                    closeMobileMenu();
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-heritage-700 dark:text-heritage-300 hover:bg-heritage-50 dark:hover:bg-neutral-700 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </>
            )}
            {!user && (
              <Link
                to="/login"
                onClick={closeMobileMenu}
                className={`p-2 rounded-lg transition-colors ${
                  location.pathname === '/login'
                    ? 'bg-heritage-100 dark:bg-heritage-800 text-heritage-700 dark:text-heritage-300'
                    : 'text-heritage-700 dark:text-heritage-300 hover:bg-heritage-50 dark:hover:bg-neutral-700'
                }`}
                aria-label="Log In"
              >
                <User className="w-5 h-5" />
              </Link>
            )}
          </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default Header;