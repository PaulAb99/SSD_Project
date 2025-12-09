import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Trophy, Star, UserPlus, Activity as ActivityIcon, Loader } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import useMapStore from '../../stores/mapStore';
import { t } from '../../utils/uiTranslations';
import { getActivityFeed } from '../../services/activityService';
import { formatDistanceToNow } from 'date-fns';

function ActivityFeed({ limit = 20 }) {
  const { isDark } = useTheme();
  const currentLanguage = useMapStore((state) => state.currentLanguage);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    setLoading(true);
    const result = await getActivityFeed(limit);
    if (result.success) {
      setActivities(result.activities);
    }
    setLoading(false);
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'discovery':
        return MapPin;
      case 'achievement':
        return Trophy;
      case 'review':
        return Star;
      case 'friend_added':
        return UserPlus;
      default:
        return ActivityIcon;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'discovery':
        return 'text-blue-500';
      case 'achievement':
        return 'text-yellow-500';
      case 'review':
        return 'text-purple-500';
      case 'friend_added':
        return 'text-green-500';
      default:
        return isDark ? 'text-neutral-400' : 'text-neutral-600';
    }
  };

  const formatTimeAgo = (dateString) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader className={`w-8 h-8 animate-spin ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`} />
        <p className={`mt-4 text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
          {t('activity.loadingActivities', currentLanguage)}
        </p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className={`text-center py-12 ${isDark ? 'bg-neutral-800' : 'bg-white'} rounded-xl`}>
        <ActivityIcon className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-neutral-600' : 'text-neutral-300'}`} />
        <p className={`text-lg font-semibold ${isDark ? 'text-neutral-300' : 'text-neutral-700'} mb-2`}>
          {t('activity.noActivities', currentLanguage)}
        </p>
        <p className={`${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
          {t('activity.startExploringWithFriends', currentLanguage)}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => {
        const Icon = getActivityIcon(activity.activity_type);
        const colorClass = getActivityColor(activity.activity_type);

        return (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`${isDark ? 'bg-neutral-800' : 'bg-white'} rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow`}
          >
            <div className="flex gap-4">
              {/* Avatar */}
              <div className={`w-12 h-12 rounded-full ${isDark ? 'bg-neutral-700' : 'bg-neutral-200'} flex items-center justify-center flex-shrink-0`}>
                {activity.avatar_url ? (
                  <img src={activity.avatar_url} alt={activity.username} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <span className={`font-bold ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                    {activity.username?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Activity Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                      {activity.username}
                    </span>
                    <Icon className={`w-4 h-4 ${colorClass}`} />
                  </div>
                  <span className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-400'} whitespace-nowrap`}>
                    {formatTimeAgo(activity.created_at)}
                  </span>
                </div>

                <h3 className={`font-semibold ${isDark ? 'text-neutral-200' : 'text-neutral-800'} mb-1`}>
                  {activity.title}
                </h3>

                {activity.description && (
                  <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'} line-clamp-2`}>
                    {activity.description}
                  </p>
                )}

                {/* Metadata badges */}
                {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {activity.metadata.category && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        isDark ? 'bg-heritage-900/30 text-heritage-300' : 'bg-heritage-100 text-heritage-800'
                      }`}>
                        {activity.metadata.category}
                      </span>
                    )}
                    {activity.metadata.rating && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        isDark ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        ⭐ {activity.metadata.rating}/5
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default ActivityFeed;
