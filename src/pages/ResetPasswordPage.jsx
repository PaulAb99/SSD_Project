import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, Check, X } from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '../lib/supabaseClient';
import { useTheme } from '../contexts/ThemeContext';

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  useEffect(() => {
    // Check if user came from reset link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setValidSession(true);
      } else {
        Swal.fire({
          title: 'Invalid or Expired Link',
          text: 'This password reset link is invalid or has expired.',
          icon: 'error',
          confirmButtonColor: '#6f4e35',
          background: isDark ? '#1f2937' : '#ffffff',
          color: isDark ? '#f3f4f6' : '#000000'
        }).then(() => {
          navigate('/login');
        });
      }
    };
    checkSession();
  }, [navigate, isDark]);

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
    if (metCount <= 2) return { label: 'Weak', color: 'text-red-600' };
    if (metCount <= 4) return { label: 'Medium', color: 'text-amber-600' };
    return { label: 'Strong', color: 'text-green-600' };
  };

  const passwordStrength = getPasswordStrength();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      await Swal.fire({
        title: 'Error',
        text: 'Passwords do not match',
        icon: 'error',
        confirmButtonColor: '#6f4e35',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#000000'
      });
      return;
    }

    if (!allRequirementsMet) {
      await Swal.fire({
        title: 'Error',
        text: 'Please meet all password requirements',
        icon: 'error',
        confirmButtonColor: '#6f4e35',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#000000'
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password
      });

      setLoading(false);

      if (error) {
        await Swal.fire({
          title: 'Error',
          text: error.message,
          icon: 'error',
          confirmButtonColor: '#6f4e35',
          background: isDark ? '#1f2937' : '#ffffff',
          color: isDark ? '#f3f4f6' : '#000000'
        });
      } else {
        await Swal.fire({
          title: 'Success!',
          text: 'Your password has been reset successfully.',
          icon: 'success',
          confirmButtonColor: '#6f4e35',
          background: isDark ? '#1f2937' : '#ffffff',
          color: isDark ? '#f3f4f6' : '#000000'
        });
        navigate('/login');
      }
    } catch (error) {
      setLoading(false);
      await Swal.fire({
        title: 'Error',
        text: 'An unexpected error occurred. Please try again.',
        icon: 'error',
        confirmButtonColor: '#6f4e35',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#000000'
      });
    }
  };

  if (!validSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-heritage-700 dark:border-heritage-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-300">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-heritage-50 via-heritage-100 to-amber-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 pt-16 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-neutral-800 rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-heritage-200 dark:bg-heritage-900/50 rounded-xl flex items-center justify-center">
            <Lock className="w-6 h-6 text-heritage-800 dark:text-heritage-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Reset Password</h1>
            <p className="text-neutral-600 dark:text-neutral-300">Enter your new password</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
              New Password
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
                placeholder="Create a strong password"
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
                  <div className="flex-1 h-1 bg-neutral-200 dark:bg-neutral-600 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        passwordStrength.label === 'Weak' ? 'bg-red-500 w-1/3' :
                        passwordStrength.label === 'Medium' ? 'bg-amber-500 w-2/3' :
                        passwordStrength.label === 'Strong' ? 'bg-green-500 w-full' : 'w-0'
                      }`}
                    />
                  </div>
                  {passwordStrength.label && (
                    <span className={`text-xs font-semibold ${
                      passwordStrength.label === 'Weak' ? 'text-red-600 dark:text-red-400' :
                      passwordStrength.label === 'Medium' ? 'text-amber-600 dark:text-amber-400' :
                      'text-green-600 dark:text-green-400'
                    }`}>
                      {passwordStrength.label}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Password requirements checklist */}
            {(passwordFocused || formData.password) && (
              <div className="mt-3 p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-600 space-y-2">
                <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Password must contain:</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {passwordRequirements.minLength ? (
                      <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <X className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                    )}
                    <span className={`text-xs ${passwordRequirements.minLength ? 'text-green-600 dark:text-green-400 font-medium' : 'text-neutral-600 dark:text-neutral-400'}`}>
                      At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordRequirements.hasUppercase ? (
                      <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <X className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                    )}
                    <span className={`text-xs ${passwordRequirements.hasUppercase ? 'text-green-600 dark:text-green-400 font-medium' : 'text-neutral-600 dark:text-neutral-400'}`}>
                      One uppercase letter (A-Z)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordRequirements.hasLowercase ? (
                      <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <X className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                    )}
                    <span className={`text-xs ${passwordRequirements.hasLowercase ? 'text-green-600 dark:text-green-400 font-medium' : 'text-neutral-600 dark:text-neutral-400'}`}>
                      One lowercase letter (a-z)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordRequirements.hasNumber ? (
                      <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <X className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                    )}
                    <span className={`text-xs ${passwordRequirements.hasNumber ? 'text-green-600 dark:text-green-400 font-medium' : 'text-neutral-600 dark:text-neutral-400'}`}>
                      One number (0-9)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordRequirements.hasSpecial ? (
                      <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <X className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                    )}
                    <span className={`text-xs ${passwordRequirements.hasSpecial ? 'text-green-600 dark:text-green-400 font-medium' : 'text-neutral-600 dark:text-neutral-400'}`}>
                      One special character (!@#$%^&*)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 pr-12 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-heritage-500 focus:border-heritage-500 transition-colors"
                placeholder="Confirm your new password"
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
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">Passwords match</span>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <span className="text-xs text-red-600 dark:text-red-400 font-medium">Passwords do not match</span>
                  </>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-heritage-700 hover:bg-heritage-800 dark:bg-heritage-600 dark:hover:bg-heritage-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
