import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Medal, Award, ArrowLeft, MapPin, Crown, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchLeaderboard, getUserRank, getUserDiscoveries } from '../services/leaderboardService';
import useMapStore from '../stores/mapStore';
import { t } from '../utils/uiTranslations';

function LeaderboardPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const currentLanguage = useMapStore((state) => state.currentLanguage);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedUsers, setExpandedUsers] = useState(new Set());
  const [userDiscoveries, setUserDiscoveries] = useState({});

  useEffect(() => {
    loadLeaderboard();
  }, [user]);

  const loadLeaderboard = async () => {
    setLoading(true);
    const data = await fetchLeaderboard(100);
    setLeaderboard(data);

    if (user) {
      const rank = await getUserRank(user.id);
      setUserRank(rank);
    }

    setLoading(false);
  };

  const getRankIcon = (rank) => {
    switch(rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <Award className="w-5 h-5 text-heritage-600" />;
    }
  };

  const getRankStyle = (rank, isCurrentUser = false) => {
    const baseStyle = "flex items-center justify-between p-4 rounded-lg transition-all ";
    
    if (isCurrentUser) {
      return baseStyle + "bg-heritage-100 dark:bg-heritage-900 border-2 border-heritage-700 dark:border-heritage-400";
    }

    switch(rank) {
      case 1:
        return baseStyle + "bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-300 dark:border-yellow-700";
      case 2:
        return baseStyle + "bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 border border-gray-300 dark:border-gray-600";
      case 3:
        return baseStyle + "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-300 dark:border-amber-700";
      default:
        return baseStyle + "bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 hover:border-heritage-300 dark:hover:border-heritage-500";
    }
  };

  const toggleUserExpand = async (userId) => {
    const newExpanded = new Set(expandedUsers);
    
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
      
      // Fetch discoveries if not already loaded
      if (!userDiscoveries[userId]) {
        const discoveries = await getUserDiscoveries(userId);
        setUserDiscoveries(prev => ({
          ...prev,
          [userId]: discoveries
        }));
      }
    }
    
    setExpandedUsers(newExpanded);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-heritage-50 via-heritage-100 to-amber-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 pt-16 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-heritage-700 dark:border-heritage-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-300">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-heritage-50 via-heritage-100 to-amber-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 pt-16">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/map')}
          className="flex items-center gap-2 text-heritage-700 dark:text-heritage-300 hover:text-heritage-900 dark:hover:text-heritage-100 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t('profile.backToMap', currentLanguage)}</span>
        </button>

        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-heritage-700 to-heritage-800 px-8 py-6">
            <div className="flex items-center gap-3">
              <Trophy className="w-10 h-10 text-amber-400" />
              <div>
                <h1 className="text-3xl font-bold text-white">{t('leaderboard.title', currentLanguage)}</h1>
                <p className="text-heritage-200">{t('leaderboard.subtitle', currentLanguage)}</p>
              </div>
            </div>
          </div>

          {/* User's Rank Card (if logged in) */}
          {user && userRank && (
            <div className="p-6 bg-heritage-50 dark:bg-neutral-700 border-b border-heritage-200 dark:border-neutral-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-heritage-700 dark:bg-heritage-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">#{userRank.rank}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900 dark:text-white">{t('leaderboard.yourRank', currentLanguage)}</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300">{profile?.username}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-heritage-700 dark:text-heritage-400">{userRank.points}</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-300">{t('profile.points', currentLanguage)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard List */}
          <div className="p-6 space-y-3">
            {leaderboard.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-heritage-300 dark:text-heritage-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                  {t('leaderboard.noExplorers', currentLanguage)}
                </h3>
                <p className="text-neutral-600 dark:text-neutral-300">{t('leaderboard.beFirst', currentLanguage)}</p>
              </div>
            ) : (
              leaderboard.map((entry) => (
                <div key={entry.id}>
                  <div
                    className={getRankStyle(entry.rank, user?.id === entry.id)}
                  >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center justify-center w-10">
                          {getRankIcon(entry.rank)}
                        </div>
                        <div className="flex items-center gap-3 flex-1">
                          <span className="font-bold text-xl text-neutral-700 dark:text-white w-8">
                            #{entry.rank}
                          </span>
                        <div className="flex-1">
                          <p className="font-semibold text-neutral-900 dark:text-white">
                            {entry.username}
                            {user?.id === entry.id && (
                              <span className="ml-2 text-xs bg-heritage-700 dark:bg-heritage-600 text-white px-2 py-1 rounded-full">
                                You
                              </span>
                            )}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                            <MapPin className="w-4 h-4" />
                            <span>{entry.discoveriesCount} {t('leaderboard.discoveries', currentLanguage)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-heritage-700 dark:text-heritage-400">
                          {entry.points}
                        </p>
                        <p className="text-xs text-neutral-600 dark:text-neutral-300">{t('profile.points', currentLanguage)}</p>
                      </div>
                      {entry.discoveriesCount > 0 && (
                        <button
                          onClick={() => toggleUserExpand(entry.id)}
                          className="p-2 hover:bg-heritage-100 dark:hover:bg-neutral-600 rounded-lg transition-colors"
                          aria-label="View discoveries"
                        >
                          {expandedUsers.has(entry.id) ? (
                            <ChevronUp className="w-5 h-5 text-heritage-700 dark:text-heritage-300" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-heritage-700 dark:text-heritage-300" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Discoveries Section */}
                  {expandedUsers.has(entry.id) && (
                    <div className="ml-14 mr-4 mb-3 mt-2 p-4 bg-heritage-50 dark:bg-neutral-700 rounded-lg border border-heritage-200 dark:border-neutral-600">
                      <h4 className="text-sm font-semibold text-heritage-900 dark:text-heritage-200 mb-3 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Discovered Locations
                      </h4>
                      
                      {!userDiscoveries[entry.id] ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="w-6 h-6 border-2 border-heritage-700 dark:border-heritage-400 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : userDiscoveries[entry.id].length === 0 ? (
                        <p className="text-sm text-neutral-600 dark:text-neutral-300 text-center py-2">{t('profile.noDiscoveriesYet', currentLanguage)}</p>
                      ) : (
                        <div className="space-y-2">
                          {userDiscoveries[entry.id].map((discovery, idx) => (
                            <div 
                              key={idx}
                              className="flex items-center gap-3 p-3 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-600 hover:border-heritage-300 dark:hover:border-heritage-500 transition-colors"
                            >
                              {discovery.imageUrl && (
                                <img 
                                  src={discovery.imageUrl} 
                                  alt={discovery.title}
                                  className="w-12 h-12 rounded-lg object-cover"
                                />
                              )}
                              <div className="flex-1">
                                <p className="font-medium text-neutral-900 dark:text-white text-sm">
                                  {discovery.title}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>{formatDate(discovery.discoveredAt)}</span>
                                  {discovery.category && (
                                    <>
                                      <span>•</span>
                                      <span>{discovery.category}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Points Info Card */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">{t('leaderboard.howPointsWork', currentLanguage)}</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-heritage-100 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-heritage-700" />
              </div>
              <div>
                <p className="font-semibold text-neutral-900 dark:text-white">{t('leaderboard.discoverLocation', currentLanguage)}</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-300">{t('leaderboard.earnPoints', currentLanguage)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LeaderboardPage;
