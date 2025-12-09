import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Key, MapPin, Trophy, ArrowLeft, Eye, EyeOff, Check, X, AlertCircle, Plus, Medal, Activity } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import useMapStore from '../stores/mapStore';
import { supabase } from '../lib/supabaseClient';
import { fetchCulturalNodes, fetchUserDiscoveries } from '../services/nodesService';
import { getUserRank } from '../services/leaderboardService';
import NodeModal from '../components/Node/NodeModal';
import AudioPlayer from '../components/Audio/AudioPlayer';
import { t, translateAllUI } from '../utils/uiTranslations';
import { translateLocationContent } from '../services/geminiService';
import Swal from 'sweetalert2';

function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const discoveredNodes = useMapStore((state) => state.discoveredNodes);
  const culturalNodes = useMapStore((state) => state.culturalNodes);
  const setSelectedNode = useMapStore((state) => state.setSelectedNode);
  const currentLanguage = useMapStore((state) => state.currentLanguage);
  const setCurrentLanguage = useMapStore((state) => state.setCurrentLanguage);
  const translatedNodes = useMapStore((state) => state.translatedNodes);
  const setTranslatedNode = useMapStore((state) => state.setTranslatedNode);
  const [activeTab, setActiveTab] = useState('credentials');
  const [loading, setLoading] = useState(false);
  const [translatingUI, setTranslatingUI] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPasswordFocused, setNewPasswordFocused] = useState(false);
  const [userStats, setUserStats] = useState({ rank: null, points: 0 });
  const [formData, setFormData] = useState({
    username: profile?.username || '',
    email: profile?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        email: profile.email || '',
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      });
    }
  }, [profile]);

  useEffect(() => {
    async function loadUserStats() {
      if (user?.id) {
        const stats = await getUserRank(user.id);
        if (stats) {
          setUserStats({ rank: stats.rank, points: stats.points });
        }
      }
    }
    loadUserStats();
  }, [user, discoveredNodes]);

  useEffect(() => {
    async function loadNodes() {
      const nodes = await fetchCulturalNodes();
      useMapStore.setState({ culturalNodes: nodes });
      
      if (user) {
        const discoveredNodeIds = await fetchUserDiscoveries(user.id);
        discoveredNodeIds.forEach((nodeId) => {
          useMapStore.getState().addDiscoveredNode(nodeId);
        });
      }
    }
    loadNodes();
  }, [user]);

  // Translate discovered nodes when page loads with non-English language
  useEffect(() => {
    async function translateDiscoveredNodes() {
      if (currentLanguage === 'en' || culturalNodes.length === 0 || discoveredNodes.size === 0) {
        return;
      }

      const discoveredNodesList = culturalNodes.filter(node => discoveredNodes.has(node.id));
      
      for (const node of discoveredNodesList) {
        // Skip if already translated
        if (translatedNodes[node.id]?.[currentLanguage]) {
          continue;
        }
        
        try {
          const translated = await translateLocationContent(node, currentLanguage);
          setTranslatedNode(node.id, currentLanguage, translated);
        } catch (error) {
          console.error(`Failed to translate node ${node.id}:`, error);
        }
      }
    }

    translateDiscoveredNodes();
  }, [currentLanguage, culturalNodes, discoveredNodes, translatedNodes, setTranslatedNode]);

  // Handle language change with UI translation
  const handleLanguageChange = async (newLanguage) => {
    if (newLanguage === currentLanguage) return;
    
    setTranslatingUI(true);
    try {
      if (newLanguage !== 'en') {
        // Translate UI
        await translateAllUI(newLanguage);
        
        // Translate all discovered nodes
        const discoveredNodesList = culturalNodes.filter(node => discoveredNodes.has(node.id));
        for (const node of discoveredNodesList) {
          // Skip if already translated
          if (translatedNodes[node.id]?.[newLanguage]) {
            continue;
          }
          
          try {
            const translated = await translateLocationContent(node, newLanguage);
            setTranslatedNode(node.id, newLanguage, translated);
          } catch (error) {
            console.error(`Failed to translate node ${node.id}:`, error);
          }
        }
      }
      setCurrentLanguage(newLanguage);
    } catch (error) {
      console.error('Failed to change language:', error);
      await Swal.fire({
        title: 'Translation Error',
        text: 'Failed to translate the interface. Please try again.',
        icon: 'error',
        confirmButtonColor: '#6f4e35'
      });
    } finally {
      setTranslatingUI(false);
    }
  };

  const discoveredNodesList = culturalNodes.filter(node => 
    discoveredNodes.has(node.id)
  );

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const passwordRequirements = {
    minLength: formData.newPassword.length >= 8,
    hasUppercase: /[A-Z]/.test(formData.newPassword),
    hasLowercase: /[a-z]/.test(formData.newPassword),
    hasNumber: /\d/.test(formData.newPassword),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword),
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

  const handleUpdateCredentials = async (e) => {
    e.preventDefault();

    // Validate password fields if any password field is filled
    if (formData.currentPassword || formData.newPassword || formData.confirmNewPassword) {
      if (!formData.currentPassword) {
        await Swal.fire({
          title: 'Error',
          text: 'Please enter your current password',
          icon: 'error',
          confirmButtonColor: '#6f4e35'
        });
        return;
      }

      if (!formData.newPassword) {
        await Swal.fire({
          title: 'Error',
          text: 'Please enter a new password',
          icon: 'error',
          confirmButtonColor: '#6f4e35'
        });
        return;
      }

      if (!allRequirementsMet) {
        await Swal.fire({
          title: 'Error',
          text: 'Please meet all password requirements',
          icon: 'error',
          confirmButtonColor: '#6f4e35'
        });
        return;
      }

      if (formData.newPassword !== formData.confirmNewPassword) {
        await Swal.fire({
          title: 'Error',
          text: 'New passwords do not match',
          icon: 'error',
          confirmButtonColor: '#6f4e35'
        });
        return;
      }
    }

    // Validate email change separately
    if (formData.email !== profile.email && !formData.email) {
      await Swal.fire({
        title: 'Error',
        text: 'Email address cannot be empty',
        icon: 'error',
        confirmButtonColor: '#6f4e35'
      });
      return;
    }

    setLoading(true);

    try {
      const updates = {};

      // Update username
      if (formData.username !== profile.username && formData.username) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ username: formData.username })
          .eq('id', user.id);

        if (profileError) {
          setLoading(false);
          
          // Check for duplicate username error
          if (profileError.code === '23505' && profileError.message.includes('profiles_username_key')) {
            await Swal.fire({
              title: 'Username Taken',
              text: 'This username is already taken. Please choose another one.',
              icon: 'error',
              confirmButtonColor: '#6f4e35'
            });
            return;
          }
          
          // Generic error for other cases
          throw profileError;
        }
        updates.username = true;
      }

      // Update email with two-step verification:
      // 1. Confirmation email sent to OLD/BASE email
      // 2. After confirmation, verification email sent to NEW email
      if (formData.email !== profile.email && formData.email) {
        const { error: emailError } = await supabase.auth.updateUser(
          { email: formData.email },
          {
            emailRedirectTo: `${window.location.origin}/profile`
          }
        );

        if (emailError) throw emailError;
        updates.email = true;
      }

      // Update password - requires current password
      if (formData.currentPassword && formData.newPassword) {
        // First verify current password by attempting to sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: profile.email,
          password: formData.currentPassword
        });

        if (signInError) {
          setLoading(false);
          await Swal.fire({
            title: 'Error',
            text: 'Current password is incorrect',
            icon: 'error',
            confirmButtonColor: '#6f4e35'
          });
          return;
        }

        // If current password is correct, update to new password
        const { error: passwordError } = await supabase.auth.updateUser({
          password: formData.newPassword
        });

        if (passwordError) throw passwordError;
        updates.password = true;
      }

      setLoading(false);

      // Auto logout after email change for security
      const shouldLogout = updates.email;

      // Reset password fields
      setFormData({ 
        ...formData, 
        currentPassword: '', 
        newPassword: '', 
        confirmNewPassword: '' 
      });

      if (shouldLogout) {
        await Swal.fire({
          title: 'Email Change Started',
          html: `
            <div class="text-left">
              <p class="mb-4"><strong>Step 1:</strong> Check your <strong>current email (${profile.email})</strong> for a confirmation link.</p>
              <p class="mb-4"><strong>Step 2:</strong> After you click the confirmation link, check your <strong>new email (${formData.email})</strong> for a verification link.</p>
              <p class="text-sm text-gray-600 mt-4">⚠️ Your email won't change until both steps are complete.</p>
            </div>
          `,
          icon: 'success',
          confirmButtonColor: '#6f4e35'
        });
        
        // Sign out user for security
        await supabase.auth.signOut();
        
        // Show confirmation and redirect
        await Swal.fire({
          title: 'Logged Out',
          text: 'For security reasons, you have been logged out. Please sign in with your new email address once verified.',
          icon: 'success',
          confirmButtonColor: '#6f4e35'
        });
        
        navigate('/login');
        return;
      }

      if (!updates.email) {
        // Only show this if email wasn't changed (no logout triggered)
        await Swal.fire({
          title: 'Success!',
          text: 'Your profile has been updated successfully.',
          icon: 'success',
          confirmButtonColor: '#6f4e35'
        });
      }
    } catch (error) {
      setLoading(false);
      await Swal.fire({
        title: 'Error',
        text: error.message || 'Failed to update profile. Please try again.',
        icon: 'error',
        confirmButtonColor: '#6f4e35'
      });
    }
  };

  const handleNodeClick = (node) => {
    setSelectedNode(node);
    navigate('/profile', { replace: true });
  };

  if (translatingUI) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-heritage-50 via-heritage-100 to-amber-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 pt-16 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-heritage-700 dark:border-heritage-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-300">Translating interface...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-heritage-50 via-heritage-100 to-amber-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 pt-16">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/map')}
          className="flex items-center gap-2 text-heritage-700 dark:text-heritage-300 hover:text-heritage-900 dark:hover:text-heritage-100 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t('profile.backToMap', currentLanguage)}</span>
        </button>

        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-heritage-700 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-heritage-100 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-heritage-800" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {profile?.username || t('profile.title', currentLanguage)}
                  </h1>
                  <p className="text-heritage-200">
                    {discoveredNodesList.length} {t('profile.of', currentLanguage)} {culturalNodes.length} {t('profile.discoveries', currentLanguage)}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {userStats.rank && (
                  <div className="flex items-center gap-2 bg-heritage-600 px-4 py-2 rounded-lg">
                    <Medal className="w-5 h-5 text-amber-300" />
                    <span className="text-white font-semibold">
                      {t('profile.rank', currentLanguage)} #{userStats.rank}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 bg-amber-500 px-4 py-2 rounded-lg">
                  <Trophy className="w-5 h-5 text-white" />
                  <span className="text-white font-semibold">
                    {userStats.points} {t('profile.points', currentLanguage)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex">
              <button
                onClick={() => setActiveTab('credentials')}
                className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                  activeTab === 'credentials'
                    ? 'border-b-2 border-heritage-700 dark:border-heritage-400 text-heritage-700 dark:text-heritage-400'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-heritage-700 dark:hover:text-heritage-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Key className="w-5 h-5" />
                  <span>{t('profile.credentials', currentLanguage)}</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('discoveries')}
                className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                  activeTab === 'discoveries'
                    ? 'border-b-2 border-heritage-700 dark:border-heritage-400 text-heritage-700 dark:text-heritage-400'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-heritage-700 dark:hover:text-heritage-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Trophy className="w-5 h-5" />
                  <span>{t('profile.yourDiscoveries', currentLanguage)}</span>
                </div>
              </button>
            </div>
          </div>

          <div className="p-8">
            {activeTab === 'credentials' && (
              <form onSubmit={handleUpdateCredentials} className="space-y-6 max-w-2xl">
                <div>
                  <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                    <span className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {t('profile.username', currentLanguage)}
                    </span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-heritage-500 focus:border-heritage-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                    <span className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {t('profile.email', currentLanguage)}
                    </span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    readOnly
                    className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-heritage-500 focus:border-transparent"
                  />
                </div>

                <div className="pt-6 border-t border-neutral-200">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    {t('profile.changeEmail', currentLanguage)}
                  </h3>
                  <div className="mb-4 space-y-2 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-700">
                    <p class="text-sm text-neutral-700 dark:text-neutral-300 mb-2"><strong>{t('profile.howItWorks', currentLanguage)}</strong></p>
                    <ol class="list-decimal list-inside space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
                      <li>{t('profile.step1', currentLanguage)} <strong>{t('profile.currentEmail', currentLanguage)}</strong> ({profile?.email})</li>
                      <li>{t('profile.step2', currentLanguage)}</li>
                      <li>{t('profile.step3', currentLanguage)} <strong>{t('profile.newEmailLower', currentLanguage)}</strong></li>
                      <li>{t('profile.step4', currentLanguage)}</li>
                    </ol>
                    <p class="text-xs text-amber-700 dark:text-amber-400 mt-3 flex items-start gap-1">
                      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      {t('profile.logoutWarning', currentLanguage)}
                    </p>
                  </div>
                  <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                    {t('profile.newEmail', currentLanguage)}
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-heritage-500 focus:border-heritage-500 transition-colors"
                  />
                </div>

                <div className="pt-6 border-t border-neutral-200 dark:border-neutral-700">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    {t('profile.changePassword', currentLanguage)}
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                        {t('profile.currentPassword', currentLanguage)}
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          name="currentPassword"
                          value={formData.currentPassword}
                          onChange={handleChange}
                          className="w-full px-4 py-3 pr-12 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-heritage-500 focus:border-heritage-500 transition-colors"
                          placeholder={t('profile.enterCurrentPassword', currentLanguage)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 transition-colors"
                          aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                        >
                          {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                  <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                        {t('profile.newPassword', currentLanguage)}
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      onFocus={() => setNewPasswordFocused(true)}
                      onBlur={() => setNewPasswordFocused(false)}
                      className="w-full px-4 py-3 pr-12 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-heritage-500 focus:border-heritage-500 transition-colors"
                      placeholder={t('profile.enterNewPassword', currentLanguage)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 transition-colors"
                      aria-label={showNewPassword ? "Hide password" : "Show password"}
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {formData.newPassword && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1 h-1 bg-neutral-200 rounded-full overflow-hidden">
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

                  {(newPasswordFocused || formData.newPassword) && formData.newPassword && (
                    <div className="mt-3 p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 space-y-2">
                      <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-200 mb-2">Password must contain:</p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {passwordRequirements.minLength ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <X className="w-4 h-4 text-neutral-400" />
                          )}
                          <span className={`text-xs ${passwordRequirements.minLength ? 'text-green-600 dark:text-green-400 font-medium' : 'text-neutral-600 dark:text-neutral-400'}`}>
                            At least 8 characters
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {passwordRequirements.hasUppercase ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <X className="w-4 h-4 text-neutral-400" />
                          )}
                          <span className={`text-xs ${passwordRequirements.hasUppercase ? 'text-green-600 dark:text-green-400 font-medium' : 'text-neutral-600 dark:text-neutral-400'}`}>
                            One uppercase letter (A-Z)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {passwordRequirements.hasLowercase ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <X className="w-4 h-4 text-neutral-400" />
                          )}
                          <span className={`text-xs ${passwordRequirements.hasLowercase ? 'text-green-600 dark:text-green-400 font-medium' : 'text-neutral-600 dark:text-neutral-400'}`}>
                            One lowercase letter (a-z)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {passwordRequirements.hasNumber ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <X className="w-4 h-4 text-neutral-400" />
                          )}
                          <span className={`text-xs ${passwordRequirements.hasNumber ? 'text-green-600 dark:text-green-400 font-medium' : 'text-neutral-600 dark:text-neutral-400'}`}>
                            One number (0-9)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {passwordRequirements.hasSpecial ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <X className="w-4 h-4 text-neutral-400" />
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
                    {t('profile.confirmPassword', currentLanguage)}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmNewPassword"
                      value={formData.confirmNewPassword}
                      onChange={handleChange}
                      className="w-full px-4 py-3 pr-12 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-heritage-500 focus:border-heritage-500 transition-colors"
                      placeholder={t('profile.confirmNewPassword', currentLanguage)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 transition-colors"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Password match indicator */}
                  {formData.confirmNewPassword && (
                    <div className="mt-2 flex items-center gap-2">
                      {formData.newPassword === formData.confirmNewPassword ? (
                        <>
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-green-600 font-medium">Passwords match</span>
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4 text-red-600" />
                          <span className="text-xs text-red-600 font-medium">Passwords do not match</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-heritage-700 hover:bg-heritage-800 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </button>
              </form>
            )}

            {activeTab === 'discoveries' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white">
                    {t('profile.yourDiscoveries', currentLanguage)} ({discoveredNodesList.length}/{culturalNodes.length})
                  </h3>
                  <button
                    onClick={() => navigate('/request-location')}
                    className="flex items-center gap-2 bg-heritage-700 hover:bg-heritage-800 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t('profile.requestLocation', currentLanguage)}</span>
                  </button>
                </div>

                {discoveredNodesList.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPin className="w-16 h-16 text-heritage-300 dark:text-heritage-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                      {t('profile.noDiscoveriesYet', currentLanguage)}
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-300 mb-6">
                      {t('profile.startExploring', currentLanguage)}
                    </p>
                    <button
                      onClick={() => navigate('/map')}
                      className="bg-heritage-700 hover:bg-heritage-800 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                      {t('profile.goToMap', currentLanguage)}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {discoveredNodesList.map((node) => {
                      // Get translated version of the node if available
                      const displayNode = currentLanguage === 'en' 
                        ? node 
                        : (translatedNodes[node.id]?.[currentLanguage] 
                          ? { ...node, ...translatedNodes[node.id][currentLanguage] }
                          : node);
                      
                      return (
                        <div
                          key={node.id}
                          onClick={() => handleNodeClick(node)}
                          className="group cursor-pointer bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
                        >
                          {displayNode.primaryImageUrl && (
                            <div className="relative h-48 overflow-hidden">
                              <img
                                src={displayNode.primaryImageUrl}
                                alt={displayNode.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                              <div className="absolute top-3 right-3 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                                <Trophy className="w-5 h-5" />
                                {t('profile.discovered', currentLanguage)}
                              </div>
                            </div>
                          )}
                          <div
                            className="p-4"
                          >
                            <h4 className="font-semibold text-neutral-900 dark:text-white mb-2 group-hover:text-heritage-700 dark:group-hover:text-heritage-400 transition-colors">
                              {displayNode.title}
                            </h4>
                            <p className="text-sm text-neutral-600 dark:text-neutral-300 line-clamp-2 mb-3">
                              {displayNode.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
                              <span>{displayNode.category}</span>
                              <span>•</span>
                              <span>{displayNode.historicalPeriod}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <NodeModal />
        <AudioPlayer />
      </div>
    </div>
  );
}

export default ProfilePage;