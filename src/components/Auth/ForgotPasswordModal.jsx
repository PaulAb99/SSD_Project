import React, { useState } from 'react';
import { X, Mail } from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '../../lib/supabaseClient';
import useMapStore from '../../stores/mapStore';
import { t } from '../../utils/uiTranslations';

function ForgotPasswordModal({ onClose }) {
  const currentLanguage = useMapStore((state) => state.currentLanguage);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Send reset link - Supabase handles email validation
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    setLoading(false);

    if (error) {
      setLoading(false);
      await Swal.fire({
        title: t('auth.errorTitle', currentLanguage),
        text: error.message,
        icon: 'error',
        confirmButtonColor: '#6f4e35'
      });
    } else {
      await Swal.fire({
        title: t('auth.checkYourEmailTitle', currentLanguage),
        html: t('auth.checkYourEmailMessage', currentLanguage),
        icon: 'success',
        confirmButtonColor: '#6f4e35'
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-heritage-200 rounded-xl flex items-center justify-center">
              <Mail className="w-5 h-5 text-heritage-800" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900">{t('auth.resetPassword', currentLanguage)}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-neutral-600" />
          </button>
        </div>

        <p className="text-neutral-600 mb-6">
          {t('auth.resetPasswordDescription', currentLanguage)}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              {t('auth.emailAddress', currentLanguage)}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-heritage-500 focus:border-heritage-500 transition-colors"
              placeholder={t('auth.emailPlaceholder', currentLanguage)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-heritage-700 hover:bg-heritage-800 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? t('auth.sending', currentLanguage) : t('auth.sendResetLink', currentLanguage)}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ForgotPasswordModal;