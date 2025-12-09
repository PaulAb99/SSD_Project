import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import ForgotPasswordModal from './ForgotPasswordModal';
import useMapStore from '../../stores/mapStore';
import { t } from '../../utils/uiTranslations';

function LoginForm() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { isDark } = useTheme();
  const currentLanguage = useMapStore((state) => state.currentLanguage);
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Determine if input is email or username
    const isEmail = formData.emailOrUsername.includes('@');
    
    const result = await signIn({
      email: isEmail ? formData.emailOrUsername : undefined,
      username: !isEmail ? formData.emailOrUsername : undefined,
      password: formData.password
    });

    setLoading(false);

    if (result.success) {
      await Swal.fire({
        title: t('auth.welcomeTitle', currentLanguage),
        text: t('auth.welcomeMessage', currentLanguage),
        icon: 'success',
        confirmButtonColor: '#6f4e35',
        timer: 1500,
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#ffffff' : '#000000'
      });
      navigate('/map');
    } else {
      await Swal.fire({
        title: t('auth.errorTitle', currentLanguage),
        text: result.error,
        icon: 'error',
        confirmButtonColor: '#6f4e35',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#ffffff' : '#000000'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-heritage-50 via-heritage-100 to-amber-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 pt-16 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-neutral-800 rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-heritage-200 dark:bg-heritage-900 rounded-xl flex items-center justify-center">
            <LogIn className="w-6 h-6 text-heritage-800 dark:text-heritage-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('auth.loginTitle', currentLanguage)}</h1>
            <p className="text-neutral-600 dark:text-neutral-300">{t('auth.loginSubtitle', currentLanguage)}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
              {t('auth.emailOrUsername', currentLanguage)}
            </label>
            <input
              type="text"
              name="emailOrUsername"
              value={formData.emailOrUsername}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-heritage-500 focus:border-heritage-500 transition-colors"
              placeholder={t('auth.emailOrUsernamePlaceholder', currentLanguage)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
              {t('auth.password', currentLanguage)}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-heritage-500 focus:border-heritage-500 transition-colors"
              placeholder={t('auth.passwordPlaceholder', currentLanguage)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-heritage-700 dark:bg-heritage-600 hover:bg-heritage-800 dark:hover:bg-heritage-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? t('auth.loggingIn', currentLanguage) : t('auth.logIn', currentLanguage)}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setShowForgotPassword(true)}
            className="text-sm text-heritage-700 dark:text-heritage-300 hover:text-heritage-800 dark:hover:text-heritage-100 font-medium transition-colors"
          >
            {t('auth.forgotPassword', currentLanguage)}
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            {t('auth.dontHaveAccount', currentLanguage)}{' '}
            <button
              onClick={() => navigate('/signup')}
              className="text-heritage-700 dark:text-heritage-400 font-semibold hover:text-heritage-800 dark:hover:text-heritage-300"
            >
              {t('auth.signUpLink', currentLanguage)}
            </button>
          </p>
        </div>

        {showForgotPassword && (
          <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />
        )}
      </div>
    </div>
  );
}

export default LoginForm;