import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Upload, X, Image, Music, Loader, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { submitLocationRequest, uploadLocationPhoto, uploadLocationAudio, deleteLocationPhoto } from '../services/locationRequestService';
import useMapStore from '../stores/mapStore';
import { t } from '../utils/uiTranslations';
import Swal from 'sweetalert2';

function RequestLocationPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentLanguage = useMapStore((state) => state.currentLanguage);
  const [loading, setLoading] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    latitude: '',
    longitude: '',
    category: '',
    historicalPeriod: '',
    submitterName: '',
    submitterEmail: user?.email || '',
    submitterPhone: '',
    audioStoryDescription: '',
  });

  const [photos, setPhotos] = useState([]);
  const [audioFile, setAudioFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [audioOption, setAudioOption] = useState(''); // 'upload' or 'generate'
  const [tempRequestId] = useState(`temp-${Date.now()}`);

  const categories = [
    { key: 'architecture', value: 'Architecture' },
    { key: 'monument', value: 'Monument' },
    { key: 'museum', value: 'Museum' },
    { key: 'religiousSite', value: 'Religious Site' },
    { key: 'historicalBuilding', value: 'Historical Building' },
    { key: 'culturalCenter', value: 'Cultural Center' },
    { key: 'parkGarden', value: 'Park & Garden' },
    { key: 'other', value: 'Other' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (photos.length + files.length > 10) {
      await Swal.fire({
        title: 'Too Many Photos',
        text: 'You can upload a maximum of 10 photos.',
        icon: 'warning',
        confirmButtonColor: '#6f4e35'
      });
      return;
    }

    setUploadingPhotos(true);

    try {
      const uploadPromises = files.map(file => 
        uploadLocationPhoto(file, user.id, tempRequestId)
      );

      const results = await Promise.all(uploadPromises);
      
      const successfulUploads = results
        .filter(result => result.success)
        .map(result => ({
          url: result.url,
          path: result.path
        }));

      setPhotos(prev => [...prev, ...successfulUploads]);

      if (successfulUploads.length < files.length) {
        await Swal.fire({
          title: 'Some Uploads Failed',
          text: `${successfulUploads.length} of ${files.length} photos uploaded successfully.`,
          icon: 'warning',
          confirmButtonColor: '#6f4e35'
        });
      }
    } catch (error) {
      console.error('Error uploading photos:', error);
      await Swal.fire({
        title: 'Upload Error',
        text: 'Failed to upload photos. Please try again.',
        icon: 'error',
        confirmButtonColor: '#6f4e35'
      });
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleRemovePhoto = async (index) => {
    const photo = photos[index];
    const result = await deleteLocationPhoto(photo.path);
    
    if (result.success) {
      setPhotos(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleAudioUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      await Swal.fire({
        title: 'Invalid File',
        text: 'Please upload an audio file (MP3, WAV, etc.)',
        icon: 'error',
        confirmButtonColor: '#6f4e35'
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      await Swal.fire({
        title: 'File Too Large',
        text: 'Audio file must be less than 10MB.',
        icon: 'error',
        confirmButtonColor: '#6f4e35'
      });
      return;
    }

    setUploadingAudio(true);

    try {
      const result = await uploadLocationAudio(file, user.id, tempRequestId);
      
      if (result.success) {
        setAudioFile(file);
        setAudioUrl(result.url);
      } else {
        await Swal.fire({
          title: 'Upload Failed',
          text: result.error || 'Failed to upload audio file.',
          icon: 'error',
          confirmButtonColor: '#6f4e35'
        });
      }
    } catch (error) {
      console.error('Error uploading audio:', error);
      await Swal.fire({
        title: 'Upload Error',
        text: 'Failed to upload audio. Please try again.',
        icon: 'error',
        confirmButtonColor: '#6f4e35'
      });
    } finally {
      setUploadingAudio(false);
    }
  };

  const handleRemoveAudio = () => {
    setAudioFile(null);
    setAudioUrl('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title || !formData.description || !formData.latitude || !formData.longitude || !formData.submitterName || !formData.submitterEmail || !formData.submitterPhone) {
      await Swal.fire({
        title: 'Missing Information',
        text: 'Please fill in all required fields.',
        icon: 'warning',
        confirmButtonColor: '#6f4e35'
      });
      return;
    }

    if (photos.length === 0) {
      await Swal.fire({
        title: 'No Photos',
        text: 'Please upload at least one photo of the location.',
        icon: 'warning',
        confirmButtonColor: '#6f4e35'
      });
      return;
    }

    // Validate audio requirement
    if (!audioOption) {
      await Swal.fire({
        title: 'Audio Required',
        text: 'Please choose an audio option: upload a file or provide a description.',
        icon: 'warning',
        confirmButtonColor: '#6f4e35'
      });
      return;
    }

    if (audioOption === 'upload' && !audioFile) {
      await Swal.fire({
        title: 'Audio Required',
        text: 'Please upload an audio file.',
        icon: 'warning',
        confirmButtonColor: '#6f4e35'
      });
      return;
    }

    if (audioOption === 'generate') {
      const sentences = formData.audioStoryDescription.split(/[.!?]+/).filter(s => s.trim());
      if (sentences.length < 8 || sentences.length > 10) {
        await Swal.fire({
          title: 'Invalid Description',
          text: 'Please provide 8-10 sentences describing the location.',
          icon: 'warning',
          confirmButtonColor: '#6f4e35'
        });
        return;
      }
    }

    setLoading(true);

    try {
      const requestData = {
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        category: formData.category,
        historical_period: formData.historicalPeriod,
        submitter_name: formData.submitterName,
        submitter_email: formData.submitterEmail,
        submitter_phone: formData.submitterPhone,
        photos: photos.map(p => p.url),
        audio_url: audioUrl || null,
        audio_description: audioOption === 'generate' ? formData.audioStoryDescription : null,
        status: 'pending'
      };

      const result = await submitLocationRequest(requestData);

      if (result.success) {
        await Swal.fire({
          title: 'Request Submitted!',
          text: 'Your location request has been submitted successfully. Our team will review it soon.',
          icon: 'success',
          confirmButtonColor: '#6f4e35'
        });
        navigate('/map');
      } else {
        await Swal.fire({
          title: 'Submission Failed',
          text: result.error || 'Failed to submit request. Please try again.',
          icon: 'error',
          confirmButtonColor: '#6f4e35'
        });
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      await Swal.fire({
        title: 'Error',
        text: 'An unexpected error occurred. Please try again.',
        icon: 'error',
        confirmButtonColor: '#6f4e35'
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6)
          }));
          Swal.fire({
            title: 'Location Found!',
            text: 'Your current location has been set.',
            icon: 'success',
            confirmButtonColor: '#6f4e35',
            timer: 1500
          });
        },
        (error) => {
          Swal.fire({
            title: 'Location Error',
            text: 'Unable to get your location. Please enter it manually.',
            icon: 'error',
            confirmButtonColor: '#6f4e35'
          });
        }
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-heritage-50 via-heritage-100 to-amber-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 pt-16">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 text-heritage-700 dark:text-heritage-300 hover:text-heritage-900 dark:hover:text-heritage-100 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t('requestLocation.backToProfile', currentLanguage)}</span>
        </button>

        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-heritage-700 to-heritage-800 px-8 py-6">
            <div className="flex items-center gap-3">
              <MapPin className="w-10 h-10 text-amber-400" />
              <div>
                <h1 className="text-3xl font-bold text-white">{t('requestLocation.title', currentLanguage)}</h1>
                <p className="text-heritage-200">{t('requestLocation.subtitle', currentLanguage)}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Location Details */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white border-b border-neutral-200 dark:border-neutral-700 pb-2">{t('requestLocation.locationDetails', currentLanguage)}
              </h2>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-200 mb-2">
                  {t('requestLocation.locationName', currentLanguage)} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder={t('requestLocation.locationNamePlaceholder', currentLanguage)}
                  className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-heritage-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-200 mb-2">
                  {t('requestLocation.description', currentLanguage)} <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder={t('requestLocation.descriptionPlaceholder', currentLanguage)}
                  rows={6}
                  className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-heritage-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-200 mb-2">
                    {t('requestLocation.category', currentLanguage)}
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-heritage-500 focus:border-transparent"
                  >
                    <option value="">{t('requestLocation.selectCategory', currentLanguage)}</option>
                    {categories.map(cat => (
                      <option key={cat.key} value={cat.value}>
                        {t(`locationCategories.${cat.key}`, currentLanguage)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-200 mb-2">
                    {t('requestLocation.historicalPeriod', currentLanguage)}
                  </label>
                  <input
                    type="text"
                    name="historicalPeriod"
                    value={formData.historicalPeriod}
                    onChange={handleInputChange}
                    placeholder={t('requestLocation.historicalPeriodPlaceholder', currentLanguage)}
                    className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-heritage-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-200 mb-2">
                  {t('requestLocation.gpsCoordinates', currentLanguage)} <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="number"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    placeholder={t('requestLocation.latitudePlaceholder', currentLanguage)}
                    step="0.000001"
                    className="px-4 py-3 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-heritage-500 focus:border-transparent"
                    required
                  />
                  <input
                    type="number"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    placeholder={t('requestLocation.longitudePlaceholder', currentLanguage)}
                    step="0.000001"
                    className="px-4 py-3 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-heritage-500 focus:border-transparent"
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="mt-2 text-sm text-heritage-700 dark:text-heritage-400 hover:text-heritage-900 dark:hover:text-heritage-300 font-medium flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  {t('requestLocation.useMyLocation', currentLanguage)}
                </button>
              </div>
            </div>

            {/* Photos Upload */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white border-b border-neutral-200 dark:border-neutral-700 pb-2">
                {t('requestLocation.photos', currentLanguage)} <span className="text-red-500">*</span>
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">{t('requestLocation.photosDescription', currentLanguage)}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {photos.map((photo, index) => (
                  <div key={index} className="relative group">
                      <img
                      src={photo.url}
                      alt={`Location photo ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border-2 border-neutral-200 dark:border-neutral-600"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {photos.length < 10 && (
                  <label className="w-full h-32 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-heritage-500 hover:bg-heritage-50 dark:hover:bg-heritage-900/20 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                      disabled={uploadingPhotos}
                    />
                    {uploadingPhotos ? (
                      <Loader className="w-8 h-8 text-heritage-700 animate-spin" />
                    ) : (
                      <>
                        <Image className="w-8 h-8 text-neutral-400 dark:text-neutral-500 mb-2" />
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">{t('requestLocation.addPhotos', currentLanguage)}</span>
                      </>
                    )}
                  </label>
                )}
              </div>
            </div>

            {/* Audio Upload */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white border-b border-neutral-200 dark:border-neutral-700 pb-2">
                {t('requestLocation.audioStory', currentLanguage)} <span className="text-red-500">*</span>
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">{t('requestLocation.audioDescription', currentLanguage)}</p>

              {/* Audio Option Selection */}
              {!audioOption && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setAudioOption('upload')}
                    className="p-6 border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 rounded-lg hover:border-heritage-500 hover:bg-heritage-50 dark:hover:bg-heritage-900/20 transition-colors text-left"
                  >
                    <div className="flex items-start gap-3">
                      <Upload className="w-6 h-6 text-heritage-700 dark:text-heritage-400 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">{t('requestLocation.uploadYourAudio', currentLanguage)}</h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-300">{t('requestLocation.uploadAudioDescription', currentLanguage)}</p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAudioOption('generate')}
                    className="p-6 border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 rounded-lg hover:border-heritage-500 hover:bg-heritage-50 dark:hover:bg-heritage-900/20 transition-colors text-left"
                  >
                    <div className="flex items-start gap-3">
                      <Music className="w-6 h-6 text-heritage-700 dark:text-heritage-400 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">{t('requestLocation.generateAudio', currentLanguage)}</h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-300">{t('requestLocation.generateAudioDescription', currentLanguage)}</p>
                      </div>
                    </div>
                  </button>
                </div>
              )}

              {/* Upload Audio Option */}
              {audioOption === 'upload' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-neutral-900 dark:text-white">{t('requestLocation.uploadAudioFile', currentLanguage)}</h3>
                    <button
                      type="button"
                      onClick={() => {
                        setAudioOption('');
                        setAudioFile(null);
                        setAudioUrl('');
                      }}
                      className="text-sm text-heritage-700 dark:text-heritage-400 hover:text-heritage-900 dark:hover:text-heritage-300 font-medium"
                    >
                      {t('requestLocation.changeOption', currentLanguage)}
                    </button>
                  </div>

                  {audioFile ? (
                    <div className="flex items-center justify-between p-4 bg-heritage-50 dark:bg-heritage-900/20 border border-heritage-200 dark:border-heritage-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Music className="w-8 h-8 text-heritage-700 dark:text-heritage-400" />
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-white">{audioFile.name}</p>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveAudio}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <label className="block w-full p-6 border-2 border-dashed border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 rounded-lg cursor-pointer hover:border-heritage-500 hover:bg-heritage-50 dark:hover:bg-heritage-900/20 transition-colors">
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleAudioUpload}
                        className="hidden"
                        disabled={uploadingAudio}
                      />
                      <div className="flex flex-col items-center">
                        {uploadingAudio ? (
                          <Loader className="w-12 h-12 text-heritage-700 dark:text-heritage-400 animate-spin mb-3" />
                        ) : (
                          <Upload className="w-12 h-12 text-neutral-400 dark:text-neutral-500 mb-3" />
                        )}
                        <p className="text-neutral-700 dark:text-neutral-200 font-medium">
                          {uploadingAudio ? t('requestLocation.uploading', currentLanguage) : t('requestLocation.clickToUpload', currentLanguage)}
                        </p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{t('requestLocation.audioFileTypes', currentLanguage)}</p>
                      </div>
                    </label>
                  )}
                </div>
              )}

              {/* Generate Audio Option */}
              {audioOption === 'generate' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-neutral-900 dark:text-white">{t('requestLocation.audioStoryDescription', currentLanguage)}</h3>
                    <button
                      type="button"
                      onClick={() => {
                        setAudioOption('');
                        setFormData(prev => ({ ...prev, audioStoryDescription: '' }));
                      }}
                      className="text-sm text-heritage-700 dark:text-heritage-400 hover:text-heritage-900 dark:hover:text-heritage-300 font-medium"
                    >
                      {t('requestLocation.changeOption', currentLanguage)}
                    </button>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-200 mb-2">
                      {t('requestLocation.write8to10Sentences', currentLanguage)}
                    </label>
                    <textarea
                      name="audioStoryDescription"
                      value={formData.audioStoryDescription}
                      onChange={handleInputChange}
                      placeholder={t('requestLocation.audioStoryPlaceholder', currentLanguage)}
                      rows={8}
                      className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-heritage-500 focus:border-transparent"
                    />
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        💡 {t('requestLocation.audioTip', currentLanguage)}
                      </p>
                      <p className="text-xs text-neutral-600 dark:text-neutral-300">
                        {formData.audioStoryDescription.split(/[.!?]+/).filter(s => s.trim()).length} {t('requestLocation.sentences', currentLanguage)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white border-b border-neutral-200 dark:border-neutral-700 pb-2">
                {t('requestLocation.contactInformation', currentLanguage)} <span className="text-red-500">*</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-200 mb-2">
                    {t('requestLocation.fullName', currentLanguage)} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="submitterName"
                    value={formData.submitterName}
                    onChange={handleInputChange}
                    placeholder={t('requestLocation.yourName', currentLanguage)}
                    className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-heritage-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-200 mb-2">
                    {t('requestLocation.email', currentLanguage)} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="submitterEmail"
                    value={formData.submitterEmail}
                    onChange={handleInputChange}
                    placeholder={t('requestLocation.emailPlaceholder', currentLanguage)}
                    readOnly
                    className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-heritage-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-200 mb-2">
                  {t('requestLocation.phoneNumber', currentLanguage)} <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="submitterPhone"
                  value={formData.submitterPhone}
                  onChange={handleInputChange}
                  placeholder={t('requestLocation.phonePlaceholder', currentLanguage)}
                  className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-heritage-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/map')}
                className="flex-1 px-6 py-3 border-2 border-heritage-700 dark:border-heritage-400 text-heritage-700 dark:text-heritage-400 rounded-lg font-semibold hover:bg-heritage-50 dark:hover:bg-heritage-900/20 transition-colors"
              >
                {t('requestLocation.cancel', currentLanguage)}
              </button>
              <button
                type="submit"
                disabled={loading || uploadingPhotos || uploadingAudio}
                className="flex-1 px-6 py-3 bg-heritage-700 text-white rounded-lg font-semibold hover:bg-heritage-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    {t('requestLocation.submitting', currentLanguage)}
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    {t('requestLocation.submitRequest', currentLanguage)}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RequestLocationPage;
