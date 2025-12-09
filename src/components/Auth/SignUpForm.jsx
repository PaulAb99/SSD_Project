import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import useMapStore from '../../stores/mapStore';
import { t } from '../../utils/uiTranslations';

function SignUpForm() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { isDark } = useTheme();
  const currentLanguage = useMapStore((state) => state.currentLanguage);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Password validation rules
  const passwordRequirements = {
    minLength: formData.password.length >= 8,
    hasUppercase: /[A-Z]/.test(formData.password),
    hasLowercase: /[a-z]/.test(formData.password),
    hasNumber: /\d/.test(formData.password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
  };

  const allRequirementsMet = Object.values(passwordRequirements).every(Boolean);

  const getPasswordStrength = () => {
    const metCount = Object.values(passwordRequirements).filter(Boolean).length;
    if (metCount === 0) return { label: '', color: '' };
    if (metCount <= 2) return { label: t('auth.passwordStrengthWeak', currentLanguage), color: 'text-red-600' };
    if (metCount <= 4) return { label: t('auth.passwordStrengthMedium', currentLanguage), color: 'text-amber-600' };
    return { label: t('auth.passwordStrengthStrong', currentLanguage), color: 'text-green-600' };
  };

  const passwordStrength = getPasswordStrength();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      await Swal.fire({
        title: t('auth.errorTitle', currentLanguage),
        text: t('auth.passwordsDoNotMatchError', currentLanguage),
        icon: 'error',
        confirmButtonColor: '#6f4e35',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#000000'
      });
      return;
    }

    if (!allRequirementsMet) {
      await Swal.fire({
        title: t('auth.errorTitle', currentLanguage),
        text: t('auth.meetPasswordRequirements', currentLanguage),
        icon: 'error',
        confirmButtonColor: '#6f4e35',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#000000'
      });
      return;
    }

    setLoading(true);

    const result = await signUp({
      email: formData.email,
      password: formData.password,
      username: formData.username
    });

    setLoading(false);

    if (result.success) {
      await Swal.fire({
        title: t('auth.successTitle', currentLanguage),
        text: t('auth.accountCreatedMessage', currentLanguage),
        icon: 'success',
        confirmButtonColor: '#6f4e35',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#000000'
      });
      navigate('/login');
    } else {
      await Swal.fire({
        title: t('auth.errorTitle', currentLanguage),
        text: result.error,
        icon: 'error',
        confirmButtonColor: '#6f4e35',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#000000'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-heritage-50 via-heritage-100 to-amber-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 pt-16 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-neutral-800 rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-heritage-200 dark:bg-heritage-800 rounded-xl flex items-center justify-center">
            <UserPlus className="w-6 h-6 text-heritage-800 dark:text-heritage-200" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('auth.signUpTitle', currentLanguage)}</h1>
            <p className="text-neutral-600 dark:text-neutral-300">{t('auth.signUpSubtitle', currentLanguage)}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
              {t('auth.username', currentLanguage)}
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-heritage-500 focus:border-heritage-500 transition-colors"
              placeholder={t('auth.usernamePlaceholder', currentLanguage)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
              {t('auth.email', currentLanguage)}
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-heritage-500 focus:border-heritage-500 transition-colors"
              placeholder={t('auth.emailPlaceholder', currentLanguage)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
              {t('auth.password', currentLanguage)}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                required
                className="w-full px-4 py-3 pr-12 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-heritage-500 focus:border-heritage-500 transition-colors"
                placeholder={t('auth.createPassword', currentLanguage)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Password strength indicator */}
            {formData.password && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        passwordStrength.label === 'Weak' ? 'bg-red-500 w-1/3' :
                        passwordStrength.label === 'Medium' ? 'bg-amber-500 w-2/3' :
                        passwordStrength.label === 'Strong' ? 'bg-green-500 w-full' : 'w-0'
                      }`}
                    />
                  </div>
                  {passwordStrength.label && (
                    <span className={`text-xs font-semibold ${passwordStrength.color}`}>
                      {passwordStrength.label}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Password requirements checklist */}
            {(passwordFocused || formData.password) && (
              <div className="mt-3 p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 space-y-2">
                <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-200 mb-2">{t('auth.passwordMustContain', currentLanguage)}</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {passwordRequirements.minLength ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-neutral-400" />
                    )}
                    <span className={`text-xs ${passwordRequirements.minLength ? 'text-green-600 dark:text-green-400 font-medium' : 'text-neutral-600 dark:text-neutral-400'}`}>
                      {t('auth.atLeast8Characters', currentLanguage)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordRequirements.hasUppercase ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-neutral-400" />
                    )}
                    <span className={`text-xs ${passwordRequirements.hasUppercase ? 'text-green-600 dark:text-green-400 font-medium' : 'text-neutral-600 dark:text-neutral-400'}`}>
                      {t('auth.oneUppercase', currentLanguage)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordRequirements.hasLowercase ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-neutral-400" />
                    )}
                    <span className={`text-xs ${passwordRequirements.hasLowercase ? 'text-green-600 dark:text-green-400 font-medium' : 'text-neutral-600 dark:text-neutral-400'}`}>
                      {t('auth.oneLowercase', currentLanguage)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordRequirements.hasNumber ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-neutral-400" />
                    )}
                    <span className={`text-xs ${passwordRequirements.hasNumber ? 'text-green-600 dark:text-green-400 font-medium' : 'text-neutral-600 dark:text-neutral-400'}`}>
                      {t('auth.oneNumber', currentLanguage)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordRequirements.hasSpecial ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-neutral-400" />
                    )}
                    <span className={`text-xs ${passwordRequirements.hasSpecial ? 'text-green-600 dark:text-green-400 font-medium' : 'text-neutral-600 dark:text-neutral-400'}`}>
                      {t('auth.oneSpecial', currentLanguage)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
              {t('auth.confirmPassword', currentLanguage)}
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 pr-12 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-heritage-500 focus:border-heritage-500 transition-colors"
                placeholder={t('auth.confirmPasswordPlaceholder', currentLanguage)}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Password match indicator */}
            {formData.confirmPassword && (
              <div className="mt-2 flex items-center gap-2">
                {formData.password === formData.confirmPassword ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-green-600 font-medium">{t('auth.passwordsMatch', currentLanguage)}</span>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 text-red-600" />
                    <span className="text-xs text-red-600 font-medium">{t('auth.passwordsDoNotMatch', currentLanguage)}</span>
                  </>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-heritage-700 hover:bg-heritage-800 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? t('auth.creatingAccount', currentLanguage) : t('auth.signUp', currentLanguage)}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {t('auth.alreadyHaveAccount', currentLanguage)}{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-heritage-700 dark:text-heritage-400 font-semibold hover:text-heritage-800 dark:hover:text-heritage-300"
            >
              {t('auth.loginLink', currentLanguage)}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignUpForm;
