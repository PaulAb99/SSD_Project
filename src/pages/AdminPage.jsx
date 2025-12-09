import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ArrowLeft, Plus, MapPin, Calendar, Tag, FileAudio, Image, X, Video, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import Swal from 'sweetalert2';
import { createCulturalNode } from '../services/nodesService';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabaseClient';

function AdminPage() {
  const navigate = useNavigate();
  const { profile, loading } = useAuth();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('create');
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [processingRequest, setProcessingRequest] = useState(null);
  const [expandedRequest, setExpandedRequest] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    latitude: '',
    longitude: '',
    proximityRadius: '100',
    description: '',
    historicalPeriod: '',
    category: 'Architecture',
    audioUrl: '',
    audioDuration: '',
    primaryImageUrl: '',
    images: [],
    videos: []
  });

  const [currentImage, setCurrentImage] = useState({
    url: '',
    caption: '',
    historicalDate: ''
  });

  const [currentVideo, setCurrentVideo] = useState({
    url: '',
    caption: ''
  });

  useEffect(() => {
    if (activeTab === 'requests') {
      fetchRequests();
    }
  }, [activeTab]);

  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const { data, error } = await supabase
        .from('location_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      await Swal.fire({
        title: 'Error',
        text: 'Failed to fetch location requests',
        icon: 'error',
        confirmButtonColor: '#6f4e35',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#000000'
      });
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleApproveRequest = async (requestId) => {
    setProcessingRequest(requestId);
    try {
      const { error } = await supabase
        .from('location_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      await Swal.fire({
        title: 'Approved!',
        text: 'Location request has been approved.',
        icon: 'success',
        confirmButtonColor: '#6f4e35',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#000000'
      });

      fetchRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      await Swal.fire({
        title: 'Error',
        text: 'Failed to approve request',
        icon: 'error',
        confirmButtonColor: '#6f4e35',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#000000'
      });
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleDiscardRequest = async (requestId) => {
    const result = await Swal.fire({
      title: 'Discard Request?',
      text: 'This will reject this location request. This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, discard it',
      background: isDark ? '#1f2937' : '#ffffff',
      color: isDark ? '#f3f4f6' : '#000000'
    });

    if (!result.isConfirmed) return;

    setProcessingRequest(requestId);
    try {
      const { error } = await supabase
        .from('location_requests')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      await Swal.fire({
        title: 'Discarded!',
        text: 'Location request has been rejected.',
        icon: 'success',
        confirmButtonColor: '#6f4e35',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#000000'
      });

      fetchRequests();
    } catch (error) {
      console.error('Error discarding request:', error);
      await Swal.fire({
        title: 'Error',
        text: 'Failed to discard request',
        icon: 'error',
        confirmButtonColor: '#6f4e35',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#000000'
      });
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleDeleteRequest = async (requestId) => {
    const result = await Swal.fire({
      title: 'Delete Request Permanently?',
      text: 'This will permanently remove this request from the database. This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it permanently',
      background: isDark ? '#1f2937' : '#ffffff',
      color: isDark ? '#f3f4f6' : '#000000'
    });

    if (!result.isConfirmed) return;

    setProcessingRequest(requestId);
    try {
      const { error } = await supabase
        .from('location_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      await Swal.fire({
        title: 'Deleted!',
        text: 'Location request has been permanently deleted.',
        icon: 'success',
        confirmButtonColor: '#6f4e35',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#000000'
      });

      fetchRequests();
    } catch (error) {
      console.error('Error deleting request:', error);
      await Swal.fire({
        title: 'Error',
        text: 'Failed to delete request',
        icon: 'error',
        confirmButtonColor: '#6f4e35',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#000000'
      });
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newNode = {
      slug: formData.title.toLowerCase().replace(/\s+/g, '-'),
      ...formData,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      proximityRadius: parseInt(formData.proximityRadius),
      audioDuration: parseInt(formData.audioDuration)
    };

    const result = await createCulturalNode(newNode);
    if (result.success) {
      await Swal.fire({
        title: 'Node Created Successfully!',
        text: 'Your cultural node has been saved to the database.',
        icon: 'success',
        confirmButtonColor: '#6f4e35',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#000000'
      });
    } else {
      await Swal.fire({
        title: 'Node Created!',
        text: `Error: ${result.message}`,
        icon: 'error',
        confirmButtonColor: '#6f4e35',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#000000'
      });
    }

    setFormData({
      title: '',
      latitude: '',
      longitude: '',
      proximityRadius: '50',
      description: '',
      historicalPeriod: '',
      category: 'Architecture',
      audioUrl: '',
      audioDuration: '',
      primaryImageUrl: '',
      images: [],
      videos: []
    });

    setCurrentImage({
      url: '',
      caption: '',
      historicalDate: ''
    });

    setCurrentVideo({
      url: '',
      caption: ''
    });
  };

  const handleAddImage = () => {
    if (currentImage.url && currentImage.caption) {
      setFormData({
        ...formData,
        images: [...formData.images, {
          url: currentImage.url,
          caption: currentImage.caption,
          ...(currentImage.historicalDate && { historicalDate: currentImage.historicalDate })
        }]
      });
      setCurrentImage({
        url: '',
        caption: '',
        historicalDate: ''
      });
    }
  };

  const handleRemoveImage = (index) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index)
    });
  };

  const handleImageChange = (e) => {
    const { name, value } = e.target;
    setCurrentImage({
      ...currentImage,
      [name]: value
    });
  };

  const handleAddVideo = () => {
    if (currentVideo.url) {
      setFormData({
        ...formData,
        videos: [...formData.videos, {
          url: currentVideo.url,
          ...(currentVideo.caption && { caption: currentVideo.caption })
        }]
      });
      setCurrentVideo({
        url: '',
        caption: ''
      });
    }
  };

  const handleRemoveVideo = (index) => {
    setFormData({
      ...formData,
      videos: formData.videos.filter((_, i) => i !== index)
    });
  };

  const handleVideoChange = (e) => {
    const { name, value } = e.target;
    setCurrentVideo({
      ...currentVideo,
      [name]: value
    });
  };

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

  if (!profile || profile.is_admin !== true) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 pt-16">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/map')}
          className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Map</span>
        </button>

        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-heritage-200 dark:bg-heritage-900 rounded-xl flex items-center justify-center">
              <Plus className="w-6 h-6 text-heritage-800 dark:text-heritage-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Admin Panel</h1>
              <p className="text-neutral-600 dark:text-neutral-300">Create new location and Review Location Requests</p>
            </div>
          </div>

          <div className="flex gap-2 mb-8 border-b border-neutral-200 dark:border-neutral-700">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
                activeTab === 'create'
                  ? 'border-heritage-700 dark:border-heritage-400 text-heritage-700 dark:text-heritage-400'
                  : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Plus className="w-5 h-5 inline mr-2" />
              Create Location
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
                activeTab === 'requests'
                  ? 'border-heritage-700 dark:border-heritage-400 text-heritage-700 dark:text-heritage-400'
                  : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <MessageSquare className="w-5 h-5 inline mr-2" />
              Location Requests
            </button>
          </div>

          {activeTab === 'create' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                  <span className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Title
                  </span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-heritage-500 focus:border-heritage-500 transition-colors"
                  placeholder="e.g., The Old Theatre"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                    <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Latitude
                    </span>
                  </label>
                  <input
                    type="number"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    required
                    step="any"
                    className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-heritage-500 focus:border-heritage-500 transition-colors"
                    placeholder="40.7484"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                    <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Longitude
                    </span>
                  </label>
                  <input
                    type="number"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    required
                    step="any"
                    className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-heritage-500 focus:border-heritage-500 transition-colors"
                    placeholder="-73.9857"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                  Proximity Radius (meters)
                </label>
                <input
                  type="number"
                  name="proximityRadius"
                  value={formData.proximityRadius}
                  onChange={handleChange}
                  required
                  readOnly
                  className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-heritage-500 focus:border-heritage-500 transition-colors"
                  placeholder="100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Historical Period
                  </span>
                </label>
                <input
                  type="text"
                  name="historicalPeriod"
                  value={formData.historicalPeriod}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-heritage-500 focus:border-heritage-500 transition-colors"
                  placeholder="e.g., 1872-1954"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-heritage-500 focus:border-heritage-500 transition-colors"
                >
                  <option value="Architecture">Architecture</option>
                  <option value="Event">Event</option>
                  <option value="Person">Person</option>
                  <option value="Artifact">Artifact</option>
                  <option value="Scenic">Scenic</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-heritage-500 focus:border-heritage-500 resize-none transition-colors"
                  placeholder="Write a detailed historical description..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                  <span className="flex items-center gap-2">
                    <FileAudio className="w-4 h-4" />
                    Audio URL
                  </span>
                </label>
                <input
                  type="url"
                  name="audioUrl"
                  value={formData.audioUrl}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-heritage-500 focus:border-heritage-500 transition-colors"
                  placeholder="/audio/story.mp3"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                  Audio Duration (seconds)
                </label>
                <input
                  type="number"
                  name="audioDuration"
                  value={formData.audioDuration}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-heritage-500 focus:border-heritage-500 transition-colors"
                  placeholder="142"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                  <span className="flex items-center gap-2">
                    <Image className="w-4 h-4" />
                    Primary Image URL
                  </span>
                </label>
                <input
                  type="url"
                  name="primaryImageUrl"
                  value={formData.primaryImageUrl}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-heritage-500 focus:border-heritage-500 transition-colors"
                  placeholder="https://images.unsplash.com/photo-..."
                />
              </div>

              <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  Videos
                </h3>
                <div className="space-y-4 bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                        Video URL
                      </label>
                      <input
                        type="url"
                        name="url"
                        value={currentVideo.url}
                        onChange={handleVideoChange}
                        className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-heritage-500 focus:border-heritage-500 transition-colors"
                        placeholder="https://example.com/video.mp4"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                        Caption (Optional)
                      </label>
                      <input
                        type="text"
                        name="caption"
                        value={currentVideo.caption}
                        onChange={handleVideoChange}
                        className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-heritage-500 focus:border-heritage-500 transition-colors"
                        placeholder="Video description"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddVideo}
                    className="w-full bg-heritage-600 hover:bg-heritage-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Video to List
                  </button>
                </div>

                {formData.videos.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      Added Videos ({formData.videos.length}):
                    </p>
                    {formData.videos.map((video, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-lg"
                      >
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                            {video.caption || 'No caption'}
                          </p>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate">
                            {video.url}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveVideo(index)}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-600 dark:text-red-400"
                          aria-label="Remove video"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                  <Image className="w-5 h-5" />
                  Additional Images
                </h3>
                <div className="space-y-4 bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                        Image URL
                      </label>
                      <input
                        type="url"
                        name="url"
                        value={currentImage.url}
                        onChange={handleImageChange}
                        className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-heritage-500 focus:border-heritage-500 transition-colors"
                        placeholder="https://images.unsplash.com/photo-..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                        Caption
                      </label>
                      <input
                        type="text"
                        name="caption"
                        value={currentImage.caption}
                        onChange={handleImageChange}
                        className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-heritage-500 focus:border-heritage-500 transition-colors"
                        placeholder="Description of the image"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                        Historical Date (Optional)
                      </label>
                      <input
                        type="text"
                        name="historicalDate"
                        value={currentImage.historicalDate}
                        onChange={handleImageChange}
                        className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-heritage-500 focus:border-heritage-500 transition-colors"
                        placeholder="e.g., 1890s, 19th century, Modern"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="w-full bg-heritage-600 hover:bg-heritage-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Image to List
                  </button>
                </div>

                {formData.images.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      Added Images ({formData.images.length}):
                    </p>
                    {formData.images.map((image, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-lg"
                      >
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                            {image.caption}
                          </p>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate">
                            {image.url}
                          </p>
                          {image.historicalDate && (
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              Date: {image.historicalDate}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-600 dark:text-red-400"
                          aria-label="Remove image"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-heritage-700 hover:bg-heritage-800 text-white px-6 py-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 mt-6"
              >
                <Plus className="w-5 h-5" />
                Create Cultural Node
              </button>
            </form>
          )}

          {activeTab === 'requests' && (
            <div>
              {loadingRequests ? (
                <div className="flex justify-center items-center py-12">
                  <div className="w-12 h-12 border-4 border-heritage-700 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                  <p className="text-neutral-600 font-semibold">No location requests yet</p>
                  <p className="text-sm text-neutral-500 mt-2">User suggestions will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map((request, index) => (
                    <div
                      key={request.id}
                      className="border border-neutral-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="w-full px-6 py-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3 flex-1">
                            <span className="text-sm font-bold text-heritage-700 bg-heritage-100 px-3 py-1 rounded-full">
                              Request #{index + 1}
                            </span>
                            <span className="text-sm text-neutral-500">
                              {new Date(request.created_at).toLocaleDateString()}
                            </span>
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                              request.status === 'approved' ? 'bg-green-100 text-green-700' :
                              request.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </span>
                          </div>
                          <button
                            onClick={() => setExpandedRequest(expandedRequest === request.id ? null : request.id)}
                            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                          >
                            {expandedRequest === request.id ? (
                              <ChevronUp className="w-5 h-5 text-neutral-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-neutral-400" />
                            )}
                          </button>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleApproveRequest(request.id)}
                            disabled={processingRequest === request.id || request.status === 'approved'}
                            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {processingRequest === request.id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : null}
                            Approve
                          </button>
                          {request.status === 'rejected' ? (
                            <button
                              onClick={() => handleDeleteRequest(request.id)}
                              disabled={processingRequest === request.id}
                              className="flex-1 px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              {processingRequest === request.id ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              ) : null}
                              Delete Permanently
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDiscardRequest(request.id)}
                              disabled={processingRequest === request.id || request.status === 'rejected'}
                              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              {processingRequest === request.id ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              ) : null}
                              {request.status === 'rejected' ? 'Delete Permanently' : 'Discard'}
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {expandedRequest === request.id && (
                        <div className="px-6 pb-6 pt-4 border-t border-neutral-100 bg-neutral-50">
                          <div className="space-y-6">
                            {/* Location Information */}
                            <div className="bg-white p-4 rounded-lg border border-neutral-200">
                              <h4 className="text-sm font-bold text-heritage-900 mb-3 uppercase tracking-wide">Location Details</h4>
                              <div className="space-y-3">
                                <div>
                                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Title</p>
                                  <p className="text-base font-medium text-heritage-900">{request.title}</p>
                                </div>
                                
                                <div>
                                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Description</p>
                                  <p className="text-base text-neutral-700 leading-relaxed">{request.description}</p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Latitude</p>
                                    <p className="text-base text-neutral-700 font-mono">{request.latitude}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Longitude</p>
                                    <p className="text-base text-neutral-700 font-mono">{request.longitude}</p>
                                  </div>
                                </div>

                                {request.category && (
                                  <div>
                                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Category</p>
                                    <p className="text-base text-neutral-700">{request.category}</p>
                                  </div>
                                )}

                                {request.historical_period && (
                                  <div>
                                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Historical Period</p>
                                    <p className="text-base text-neutral-700">{request.historical_period}</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Submitter Information */}
                            <div className="bg-white p-4 rounded-lg border border-neutral-200">
                              <h4 className="text-sm font-bold text-heritage-900 mb-3 uppercase tracking-wide">Submitter Information</h4>
                              <div className="space-y-3">
                                <div>
                                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Name</p>
                                  <p className="text-base text-neutral-700">{request.submitter_name}</p>
                                </div>

                                <div>
                                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Email</p>
                                  <p className="text-base text-neutral-700">{request.submitter_email}</p>
                                </div>

                                <div>
                                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Phone</p>
                                  <p className="text-base text-neutral-700">{request.submitter_phone}</p>
                                </div>
                              </div>
                            </div>

                            {/* Media Content */}
                            {((request.photos && request.photos.length > 0) || request.audio_url || request.audio_description) && (
                              <div className="bg-white p-4 rounded-lg border border-neutral-200">
                                <h4 className="text-sm font-bold text-heritage-900 mb-3 uppercase tracking-wide">Media Content</h4>
                                <div className="space-y-3">
                                  {request.photos && request.photos.length > 0 && (
                                    <div>
                                      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Photos ({request.photos.length})</p>
                                      <div className="grid grid-cols-3 gap-2">
                                        {request.photos.map((photo, idx) => (
                                          <a 
                                            key={idx} 
                                            href={photo} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="block aspect-square rounded-lg overflow-hidden border border-neutral-200 hover:border-heritage-500 transition-colors"
                                          >
                                            <img 
                                              src={photo} 
                                              alt={`Photo ${idx + 1}`} 
                                              className="w-full h-full object-cover"
                                            />
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {request.audio_url && (
                                    <div>
                                      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Audio File</p>
                                      <audio controls className="w-full">
                                        <source src={request.audio_url} type="audio/mpeg" />
                                        Your browser does not support the audio element.
                                      </audio>
                                    </div>
                                  )}

                                  {request.audio_description && (
                                    <div>
                                      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Audio Description (for AI generation)</p>
                                      <p className="text-base text-neutral-700 leading-relaxed">{request.audio_description}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Request Status */}
                            <div className="bg-white p-4 rounded-lg border border-neutral-200">
                              <h4 className="text-sm font-bold text-heritage-900 mb-3 uppercase tracking-wide">Request Status</h4>
                              <div className="space-y-3">
                                <div>
                                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Status</p>
                                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                                    request.status === 'approved' ? 'bg-green-100 text-green-700' :
                                    request.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                    'bg-amber-100 text-amber-700'
                                  }`}>
                                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                  </span>
                                </div>

                                {request.admin_notes && (
                                  <div>
                                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Admin Notes</p>
                                    <p className="text-base text-neutral-700 leading-relaxed">{request.admin_notes}</p>
                                  </div>
                                )}

                                {request.reviewed_at && (
                                  <div>
                                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Reviewed On</p>
                                    <p className="text-base text-neutral-700">
                                      {new Date(request.reviewed_at).toLocaleString()}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Timestamps */}
                            <div className="bg-white p-4 rounded-lg border border-neutral-200">
                              <h4 className="text-sm font-bold text-heritage-900 mb-3 uppercase tracking-wide">Timestamps</h4>
                              <div className="space-y-3">
                                <div>
                                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Submitted On</p>
                                  <p className="text-base text-neutral-700">
                                    {new Date(request.created_at).toLocaleString()}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Last Updated</p>
                                  <p className="text-base text-neutral-700">
                                    {new Date(request.updated_at).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPage;