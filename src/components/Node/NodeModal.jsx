import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Calendar, Tag, Play, Pause, Navigation, Loader, Star, Edit2, Trash2 } from 'lucide-react';
import useMapStore from '../../stores/mapStore';
import useAudioStore from '../../stores/audioStore';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { translateLocationContent, getLanguageName } from '../../services/geminiService';
import { t } from '../../utils/uiTranslations';
import { getReviewsForNode, getNodeRating, createReview, updateReview, deleteReview, getUserReviewForNode } from '../../services/reviewsService';
import Swal from 'sweetalert2';

function NodeModal() {
  const { user, profile } = useAuth();
  const { isDark } = useTheme();
  const selectedNode = useMapStore((state) => state.selectedNode);
  const clearSelectedNode = useMapStore((state) => state.clearSelectedNode);
  const discoveredNodes = useMapStore((state) => state.discoveredNodes);
  const userLocation = useMapStore((state) => state.userLocation);
  const map = useMapStore((state) => state.map);
  const clearRouteFunction = useMapStore((state) => state.clearRouteFunction);
  const createRouteFunction = useMapStore((state) => state.createRouteFunction);
  const currentLanguage = useMapStore((state) => state.currentLanguage);
  const translatedNodes = useMapStore((state) => state.translatedNodes);
  const setTranslatedNode = useMapStore((state) => state.setTranslatedNode);
  const nodeReviews = useMapStore((state) => state.nodeReviews);
  const setNodeReviews = useMapStore((state) => state.setNodeReviews);
  const addReviewToNode = useMapStore((state) => state.addReviewToNode);
  const updateReviewInNode = useMapStore((state) => state.updateReviewInNode);
  const removeReviewFromNode = useMapStore((state) => state.removeReviewFromNode);
  const currentNode = useAudioStore((state) => state.currentNode);
  const isPlaying = useAudioStore((state) => state.isPlaying);
  const playAudio = useAudioStore((state) => state.playAudio);
  const pauseAudio = useAudioStore((state) => state.pauseAudio);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [translating, setTranslating] = useState(false);
  const [displayNode, setDisplayNode] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [userReview, setUserReview] = useState(null);

  useEffect(() => {
    if (!selectedNode) {
      setDisplayNode(null);
      document.body.style.overflow = 'unset';
      return;
    }

    document.body.style.overflow = 'hidden';
    setCurrentVideoIndex(0);

    // Fetch reviews for this node
    fetchReviews();

    // If English or translation already exists, use it
    if (currentLanguage === 'en') {
      setDisplayNode(selectedNode);
    } else if (translatedNodes[selectedNode.id]?.[currentLanguage]) {
      setDisplayNode({
        ...selectedNode,
        ...translatedNodes[selectedNode.id][currentLanguage]
      });
    } else {
      // Translate on-demand
      translateNode();
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedNode, currentLanguage, translatedNodes]);

  const translateNode = async () => {
    if (!selectedNode) return;
    
    setTranslating(true);
    try {
      const translated = await translateLocationContent(selectedNode, getLanguageName(currentLanguage));
      setTranslatedNode(selectedNode.id, currentLanguage, translated);
      setDisplayNode({
        ...selectedNode,
        ...translated
      });
    } catch (error) {
      console.error('Translation failed:', error);
      await Swal.fire({
        title: 'Translation Failed',
        text: 'Unable to translate content. Showing original.',
        icon: 'warning',
        confirmButtonColor: '#6f4e35',
        timer: 2000
      });
      setDisplayNode(selectedNode);
    } finally {
      setTranslating(false);
    }
  };

  const fetchReviews = async () => {
    if (!selectedNode) return;
    
    setLoadingReviews(true);
    try {
      const [reviewsResult, ratingResult, userReviewResult] = await Promise.all([
        getReviewsForNode(selectedNode.id),
        getNodeRating(selectedNode.id),
        user ? getUserReviewForNode(selectedNode.id, user.id) : Promise.resolve({ success: true, review: null })
      ]);

      if (reviewsResult.success && ratingResult.success) {
        setNodeReviews(
          selectedNode.id,
          reviewsResult.reviews,
          ratingResult.averageRating,
          ratingResult.totalReviews
        );
      }

      if (userReviewResult.success) {
        setUserReview(userReviewResult.review);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleLeaveReview = async () => {
    const currentLang = useMapStore.getState().currentLanguage;
    const isDiscovered = discoveredNodes.has(selectedNode.id);
    
    if (!isDiscovered) {
      await Swal.fire({
        title: t('reviews.unlockFirst', currentLang) || 'Unlock Location First',
        text: t('reviews.discoverToReview', currentLang) || 'You must discover this location before leaving a review.',
        icon: 'warning',
        confirmButtonColor: '#6f4e35',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#000000',
        customClass: {
          container: 'z-[2100]'
        }
      });
      return;
    }

    const { value: formValues } = await Swal.fire({
      title: userReview ? (t('reviews.editReview', currentLang) || 'Edit Your Review') : (t('reviews.leaveReview', currentLang) || 'Leave a Review'),
      html: `
        <div class="space-y-4 text-left">
          <div>
            <label class="block text-sm font-semibold ${isDark ? 'text-neutral-100' : 'text-neutral-900'} mb-2">
              ${t('reviews.rating', currentLang) || 'Rating'}
            </label>
            <div class="flex gap-2 justify-center mb-4" id="star-rating">
              ${[1, 2, 3, 4, 5].map(star => `
                <button type="button" class="star-btn text-4xl ${star <= (userReview?.rating || 0) ? 'text-amber-500' : 'text-neutral-300'}" data-rating="${star}">
                  ★
                </button>
              `).join('')}
            </div>
            <input type="hidden" id="rating-value" value="${userReview?.rating || 0}">
          </div>
          <div>
            <label class="block text-sm font-semibold ${isDark ? 'text-neutral-100' : 'text-neutral-900'} mb-2">
              ${t('reviews.yourReview', currentLang) || 'Your Review'} (${t('reviews.optional', currentLang) || 'Optional'})
            </label>
            <textarea
              id="review-text"
              rows="4"
              class="w-full px-4 py-2 border ${isDark ? 'border-neutral-600 bg-neutral-700 text-neutral-100' : 'border-neutral-300 bg-white text-neutral-900'} rounded-lg focus:ring-2 focus:ring-heritage-500 focus:border-heritage-500"
              placeholder="${t('reviews.sharethoughts', currentLang) || 'Share your thoughts about this location...'}"
            >${userReview?.review_text || ''}</textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: '#6f4e35',
      cancelButtonColor: '#6b7280',
      confirmButtonText: userReview ? (t('reviews.update', currentLang) || 'Update') : (t('reviews.submit', currentLang) || 'Submit'),
      cancelButtonText: t('common.cancel', currentLang) || 'Cancel',
      background: isDark ? '#1f2937' : '#ffffff',
      color: isDark ? '#f3f4f6' : '#000000',
      customClass: {
        container: 'z-[2100]'
      },
      didOpen: () => {
        const stars = document.querySelectorAll('.star-btn');
        const ratingInput = document.getElementById('rating-value');
        
        stars.forEach(star => {
          star.addEventListener('click', () => {
            const rating = parseInt(star.dataset.rating);
            ratingInput.value = rating;
            stars.forEach((s, idx) => {
              if (idx < rating) {
                s.classList.remove('text-neutral-300');
                s.classList.add('text-amber-500');
              } else {
                s.classList.remove('text-amber-500');
                s.classList.add('text-neutral-300');
              }
            });
          });
        });
      },
      preConfirm: () => {
        const rating = parseInt(document.getElementById('rating-value').value);
        const reviewText = document.getElementById('review-text').value;
        
        if (!rating || rating < 1) {
          Swal.showValidationMessage(t('reviews.selectRating', currentLang) || 'Please select a rating');
          return false;
        }
        
        return { rating, reviewText };
      }
    });

    if (!formValues) return;

    try {
      let result;
      if (userReview) {
        result = await updateReview(userReview.id, formValues.rating, formValues.reviewText);
        if (result.success) {
          updateReviewInNode(selectedNode.id, result.review);
          setUserReview(result.review);
        }
      } else {
        result = await createReview(
          selectedNode.id,
          user.id,
          profile?.username || user.email,
          formValues.rating,
          formValues.reviewText
        );
        if (result.success) {
          addReviewToNode(selectedNode.id, result.review);
          setUserReview(result.review);
        }
      }

      if (result.success) {
        await Swal.fire({
          title: t('reviews.success', currentLang) || 'Success!',
          text: userReview ? (t('reviews.reviewUpdated', currentLang) || 'Your review has been updated') : (t('reviews.reviewSubmitted', currentLang) || 'Your review has been submitted'),
          icon: 'success',
          confirmButtonColor: '#6f4e35',
          timer: 2000,
          background: isDark ? '#1f2937' : '#ffffff',
          color: isDark ? '#f3f4f6' : '#000000',
          customClass: {
            container: 'z-[2100]'
          }
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      await Swal.fire({
        title: t('common.error', currentLang) || 'Error',
        text: error.message || (t('reviews.submitFailed', currentLang) || 'Failed to submit review. Please try again.'),
        icon: 'error',
        confirmButtonColor: '#6f4e35',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#000000',
        customClass: {
          container: 'z-[2100]'
        }
      });
    }
  };

  const handleDeleteReview = async (reviewId) => {
    const currentLang = useMapStore.getState().currentLanguage;
    const result = await Swal.fire({
      title: t('reviews.deleteConfirm', currentLang) || 'Delete Review?',
      text: t('reviews.deleteWarning', currentLang) || 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: t('common.delete', currentLang) || 'Delete',
      cancelButtonText: t('common.cancel', currentLang) || 'Cancel',
      background: isDark ? '#1f2937' : '#ffffff',
      color: isDark ? '#f3f4f6' : '#000000',
      customClass: {
        container: 'z-[2100]'
      }
    });

    if (!result.isConfirmed) return;

    try {
      const deleteResult = await deleteReview(reviewId);
      if (deleteResult.success) {
        removeReviewFromNode(selectedNode.id, reviewId);
        if (userReview?.id === reviewId) {
          setUserReview(null);
        }
        await Swal.fire({
          title: t('reviews.deleted', currentLang) || 'Deleted',
          text: t('reviews.reviewDeleted', currentLang) || 'Your review has been deleted',
          icon: 'success',
          confirmButtonColor: '#6f4e35',
          timer: 2000,
          background: isDark ? '#1f2937' : '#ffffff',
          color: isDark ? '#f3f4f6' : '#000000',
          customClass: {
            container: 'z-[2100]'
          }
        });
      } else {
        throw new Error(deleteResult.error);
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      await Swal.fire({
        title: t('common.error', currentLang) || 'Error',
        text: t('reviews.deleteFailed', currentLang) || 'Failed to delete review. Please try again.',
        icon: 'error',
        confirmButtonColor: '#6f4e35',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#000000',
        customClass: {
          container: 'z-[2100]'
        }
      });
    }
  };

  const renderStars = (rating, size = 'w-5 h-5') => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${
              star <= Math.round(rating)
                ? 'fill-amber-500 text-amber-500'
                : 'fill-neutral-300 text-neutral-300 dark:fill-neutral-600 dark:text-neutral-600'
            }`}
          />
        ))}
      </div>
    );
  };

  if (!selectedNode) return null;

  const isDiscovered = discoveredNodes.has(selectedNode.id);
  const isCurrentlyPlaying = currentNode?.id === selectedNode.id && isPlaying;
  const hasVideos = selectedNode.videos && selectedNode.videos.length > 0;

  const handleAudioToggle = () => {
    if (isCurrentlyPlaying) {
      pauseAudio();
    } else {
      playAudio(selectedNode);
    }
  };

  const handleGetDirections = () => {
    if (!userLocation || !selectedNode || !map) return;
    if (!createRouteFunction) {
      console.error('Create route function not available');
      return;
    }
    createRouteFunction(userLocation, [selectedNode]);
    clearSelectedNode();
  };

  const handleNextVideo = () => {
    if (hasVideos) {
      setCurrentVideoIndex((prev) => (prev + 1) % selectedNode.videos.length);
    }
  };

  const handlePrevVideo = () => {
    if (hasVideos) {
      setCurrentVideoIndex((prev) => 
        prev === 0 ? selectedNode.videos.length - 1 : prev - 1
      );
    }
  };

  return (
    <AnimatePresence>
      {selectedNode && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[2000]"
            onClick={clearSelectedNode}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-800 rounded-t-3xl shadow-2xl z-[2001] max-h-[85vh] overflow-y-auto"
          >
            {translating ? (
              <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
                <Loader className="w-12 h-12 text-heritage-700 dark:text-heritage-400 animate-spin mb-4" />
                <p className="text-neutral-700 dark:text-neutral-300 font-medium">
                  {t('loading', currentLanguage)} {getLanguageName(currentLanguage)}...
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
                  {t('translatedTo', currentLanguage)} {getLanguageName(currentLanguage)}
                </p>
              </div>
            ) : displayNode ? (
              <>
                <div className="sticky top-0 bg-white dark:bg-neutral-800 px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 rounded-t-3xl z-10">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                        {displayNode?.title || selectedNode.title}
                      </h3>
                      {/* Star Rating */}
                      <div className="flex items-center gap-3 mb-1">
                        {renderStars(nodeReviews[selectedNode.id]?.averageRating || 0)}
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">
                          {nodeReviews[selectedNode.id]?.averageRating?.toFixed(1) || '0.0'} 
                          {' '}({nodeReviews[selectedNode.id]?.totalReviews || 0} {t('reviews.reviews', currentLanguage) || 'reviews'})
                        </span>
                      </div>
                      {currentLanguage !== 'en' && (
                        <p className="text-xs text-heritage-600 dark:text-heritage-400 mt-1">
                          🌐 {t('node.translatedTo', currentLanguage)} {getLanguageName(currentLanguage)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Leave Review Button */}
                      {user && (
                        <button
                          onClick={handleLeaveReview}
                          disabled={!discoveredNodes.has(selectedNode.id)}
                          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${
                            discoveredNodes.has(selectedNode.id)
                              ? 'bg-heritage-700 hover:bg-heritage-800 text-white'
                              : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
                          }`}
                          title={!discoveredNodes.has(selectedNode.id) ? (t('reviews.unlockToReview', currentLanguage) || 'Unlock location to review') : ''}
                        >
                          {userReview ? <Edit2 className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                          <span>{userReview ? (t('reviews.editReview', currentLanguage) || 'Edit Review') : (t('reviews.leaveReview', currentLanguage) || 'Leave Review')}</span>
                        </button>
                      )}
                      <button
                        onClick={clearSelectedNode}
                        className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full transition-colors"
                        aria-label="Close"
                      >
                        <X className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
                      </button>
                    </div>
                  </div>
                </div>

            <div className="p-6">
              {hasVideos && (
                <div className="relative w-full mb-6 rounded-xl overflow-hidden bg-black">
                  <video
                    key={currentVideoIndex}
                    className="w-full h-64 object-cover"
                    controls
                    autoPlay
                    playsInline
                  >
                    <source src={selectedNode.videos[currentVideoIndex].url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  {selectedNode.videos.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevVideo}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                        aria-label="Previous video"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={handleNextVideo}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                        aria-label="Next video"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                        {selectedNode.videos.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentVideoIndex(index)}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              index === currentVideoIndex ? 'bg-white' : 'bg-white/50'
                            }`}
                            aria-label={`Video ${index + 1}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                  {selectedNode.videos[currentVideoIndex].caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                      <p className="text-sm text-white">
                        {displayNode?.videos?.[currentVideoIndex]?.caption || selectedNode.videos[currentVideoIndex].caption}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {selectedNode.primaryImageUrl && (
                <div className="relative w-full h-64 rounded-xl overflow-hidden mb-6">
                  <img
                    src={selectedNode.primaryImageUrl}
                    alt={selectedNode.title}
                    className="w-full h-full object-cover"
                  />
                  {!isDiscovered && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="text-center text-white px-4">
                        <MapPin className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-sm font-medium">Get closer to unlock</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-4 mb-4 text-sm text-neutral-600 dark:text-neutral-300">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{displayNode.historicalPeriod || selectedNode.historicalPeriod}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Tag className="w-4 h-4" />
                  <span>{displayNode.category || selectedNode.category}</span>
                </div>
              </div>

              {userLocation && (
                <button
                  onClick={handleGetDirections}
                  className="w-full mb-6 bg-amber-600 hover:bg-amber-700 text-white px-6 py-4 rounded-xl flex items-center justify-center gap-3 transition-colors font-semibold"
                >
                  <Navigation className="w-5 h-5" />
                  <span>{t('node.getDirections', currentLanguage)}</span>
                </button>
              )}

              <p className="text-neutral-700 dark:text-neutral-300 mb-6 leading-relaxed">
                {isDiscovered
                  ? (displayNode.description || selectedNode.description)
                  : t('node.unlockLocation', currentLanguage)}
              </p>

              {isDiscovered && selectedNode.audioUrl && (
                <button
                  onClick={handleAudioToggle}
                  className="w-full mb-6 bg-heritage-700 hover:bg-heritage-800 text-white px-6 py-4 rounded-xl flex items-center justify-center gap-3 transition-colors"
                >
                  {isCurrentlyPlaying ? (
                    <>
                      <Pause className="w-5 h-5" />
                      <span className="font-semibold">{t('node.pauseStory', currentLanguage)}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      <span className="font-semibold">
                        {t('node.listenToStory', currentLanguage)} ({Math.floor(selectedNode.audioDuration / 60)}:
                        {(selectedNode.audioDuration % 60).toString().padStart(2, '0')})
                      </span>
                    </>
                  )}
                </button>
              )}

              {isDiscovered && selectedNode.images && selectedNode.images.length > 0 && (
                <div className="mt-6 space-y-4">
                  {selectedNode.images.map((image, index) => {
                    const translatedCaption = displayNode?.images?.[index]?.caption || image.caption;
                    return (
                      <div key={index} className="space-y-2">
                        <img
                          src={image.url}
                          alt={translatedCaption}
                          className="w-full rounded-lg"
                        />
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 italic">
                          {translatedCaption}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Reviews Section */}
              <div className="mt-8 pt-8 border-t border-neutral-200 dark:border-neutral-700">
                <h4 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
                  {t('reviews.title', currentLanguage) || 'Reviews'} ({nodeReviews[selectedNode.id]?.totalReviews || 0})
                </h4>

                {loadingReviews ? (
                  <div className="flex justify-center py-8">
                    <Loader className="w-8 h-8 text-heritage-700 dark:text-heritage-400 animate-spin" />
                  </div>
                ) : nodeReviews[selectedNode.id]?.reviews?.length > 0 ? (
                  <div className="space-y-4">
                    {nodeReviews[selectedNode.id].reviews.map((review) => (
                      <div key={review.id} className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-semibold text-neutral-900 dark:text-white">
                                {review.username}
                              </span>
                              <div className="flex items-center gap-1">
                                {renderStars(review.rating, 'w-4 h-4')}
                                <span className="text-sm text-neutral-600 dark:text-neutral-400 ml-1">
                                  {review.rating}/5
                                </span>
                              </div>
                            </div>
                            {review.review_text && (
                              <p className="text-neutral-700 dark:text-neutral-300 text-sm">
                                {review.review_text}
                              </p>
                            )}
                            <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-2">
                              {new Date(review.created_at).toLocaleDateString(currentLanguage === 'ro' ? 'ro-RO' : 'en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          {user && review.user_id === user.id && (
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                onClick={handleLeaveReview}
                                className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                                aria-label="Edit review"
                              >
                                <Edit2 className="w-4 h-4 text-heritage-700 dark:text-heritage-400" />
                              </button>
                              <button
                                onClick={() => handleDeleteReview(review.id)}
                                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                aria-label="Delete review"
                              >
                                <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Star className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
                    <p className="text-neutral-600 dark:text-neutral-400">
                      {t('reviews.noReviews', currentLanguage) || 'No reviews yet. Be the first to review!'}
                    </p>
                    {user && discoveredNodes.has(selectedNode.id) && (
                      <button
                        onClick={handleLeaveReview}
                        className="mt-4 bg-heritage-700 hover:bg-heritage-800 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                      >
                        {t('reviews.beFirst', currentLanguage) || 'Leave the First Review'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            </>
          ) : (
            <div className="p-8 text-center">
              <p className="text-neutral-600 dark:text-neutral-300">Loading...</p>
            </div>
          )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default NodeModal;
