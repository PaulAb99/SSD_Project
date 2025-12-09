import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Users, Clock, Check, X, Search, Loader, UserMinus, MapPin } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import useMapStore from '../stores/mapStore';
import { t } from '../utils/uiTranslations';
import {
  searchUsers,
  sendFriendRequest,
  getPendingRequests,
  getSentRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getFriendsList,
  getFriendDiscoveries
} from '../services/friendsService';

function FriendsPage() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const currentLanguage = useMapStore((state) => state.currentLanguage);

  const [activeTab, setActiveTab] = useState('friends'); // friends, find, requests
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [friendDiscoveries, setFriendDiscoveries] = useState([]);
  const [loadingDiscoveries, setLoadingDiscoveries] = useState(false);

  useEffect(() => {
    if (user) {
      loadFriendsData();
    }
  }, [user]);

  const loadFriendsData = async () => {
    setRefreshing(true);
    await Promise.all([
      loadFriends(),
      loadPendingRequests(),
      loadSentRequests()
    ]);
    setRefreshing(false);
  };

  const loadFriends = async () => {
    const result = await getFriendsList();
    if (result.success) {
      setFriends(result.friends);
    }
  };

  const loadPendingRequests = async () => {
    const result = await getPendingRequests();
    if (result.success) {
      setPendingRequests(result.requests);
    }
  };

  const loadSentRequests = async () => {
    const result = await getSentRequests();
    if (result.success) {
      setSentRequests(result.requests);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    const result = await searchUsers(searchTerm);
    if (result.success) {
      // Filter out current user and existing friends
      const filteredResults = result.users.filter(u => 
        u.id !== user.id && !friends.some(f => f.friend_id === u.id)
      );
      setSearchResults(filteredResults);
    }
    setLoading(false);
  };

  const handleSendRequest = async (friendId, username) => {
    const result = await sendFriendRequest(friendId);
    if (result.success) {
      await Swal.fire({
        title: t('friends.friendRequestSent', currentLanguage),
        text: t('friends.requestSentTo', currentLanguage).replace('{username}', username),
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#000000'
      });
      loadSentRequests();
      setSearchResults(searchResults.filter(u => u.id !== friendId));
    } else {
      await Swal.fire({
        title: t('friends.errorSendingRequest', currentLanguage),
        text: result.error,
        icon: 'error',
        confirmButtonColor: '#6f4e35',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#000000'
      });
    }
  };

  const handleAcceptRequest = async (friendshipId, username) => {
    const result = await acceptFriendRequest(friendshipId);
    if (result.success) {
      await Swal.fire({
        title: t('friends.friendRequestAccepted', currentLanguage),
        text: t('friends.nowFriendsWith', currentLanguage).replace('{username}', username),
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#000000'
      });
      loadFriendsData();
    }
  };

  const handleRejectRequest = async (friendshipId) => {
    const result = await rejectFriendRequest(friendshipId);
    if (result.success) {
      loadPendingRequests();
    }
  };

  const handleRemoveFriend = async (friendId, username) => {
    const result = await Swal.fire({
      title: t('friends.confirmRemove', currentLanguage),
      text: t('friends.confirmRemoveText', currentLanguage).replace('{username}', username),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: t('friends.yesRemove', currentLanguage),
      cancelButtonText: t('route.cancel', currentLanguage),
      background: isDark ? '#1f2937' : '#ffffff',
      color: isDark ? '#f3f4f6' : '#000000'
    });

    if (result.isConfirmed) {
      const removeResult = await removeFriend(friendId);
      if (removeResult.success) {
        loadFriendsData();
        await Swal.fire({
          title: t('friends.removed', currentLanguage),
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          background: isDark ? '#1f2937' : '#ffffff',
          color: isDark ? '#f3f4f6' : '#000000'
        });
      }
    }
  };

  const handleViewDiscoveries = async (friend) => {
    setSelectedFriend(friend);
    setLoadingDiscoveries(true);
    const result = await getFriendDiscoveries(friend.friend_id);
    if (result.success) {
      setFriendDiscoveries(result.discoveries);
    } else {
      await Swal.fire({
        title: 'Error',
        text: result.error,
        icon: 'error',
        confirmButtonColor: '#6f4e35',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#000000'
      });
    }
    setLoadingDiscoveries(false);
  };

  const handleCloseDiscoveries = () => {
    setSelectedFriend(null);
    setFriendDiscoveries([]);
  };

  const tabs = [
    { id: 'friends', label: t('friends.tabFriends', currentLanguage), icon: Users },
    { id: 'find', label: t('friends.tabFind', currentLanguage), icon: Search },
    { id: 'requests', label: t('friends.tabRequests', currentLanguage), icon: Clock, badge: pendingRequests.length }
  ];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-neutral-900' : 'bg-neutral-50'} py-8 px-4`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'} mb-2`}>
            {t('friends.title', currentLanguage)}
          </h1>
          <p className={`${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
            {t('friends.subtitle', currentLanguage)}
          </p>
        </div>

        {/* Tabs */}
        <div className={`flex gap-2 mb-6 border-b ${isDark ? 'border-neutral-700' : 'border-neutral-200'}`}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-semibold transition-all relative flex items-center gap-2 ${
                activeTab === tab.id
                  ? `${isDark ? 'text-heritage-400 border-heritage-400' : 'text-heritage-700 border-heritage-700'} border-b-2`
                  : `${isDark ? 'text-neutral-400' : 'text-neutral-600'} border-b-2 border-transparent hover:${isDark ? 'text-neutral-200' : 'text-neutral-900'}`
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
              {tab.badge > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 ml-1">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Friends List Tab */}
        {activeTab === 'friends' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                {t('friends.tabFriends', currentLanguage)} ({friends.length})
              </h2>
              <button
                onClick={loadFriendsData}
                disabled={refreshing}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-neutral-800' : 'hover:bg-neutral-100'
                }`}
              >
                <Loader className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''} ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`} />
              </button>
            </div>

            {friends.length === 0 ? (
              <div className={`text-center py-12 ${isDark ? 'bg-neutral-800' : 'bg-white'} rounded-xl`}>
                <Users className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-neutral-600' : 'text-neutral-300'}`} />
                <p className={`text-lg font-semibold ${isDark ? 'text-neutral-300' : 'text-neutral-700'} mb-2`}>
                  {t('friends.noFriends', currentLanguage)}
                </p>
                <p className={`${isDark ? 'text-neutral-400' : 'text-neutral-600'} mb-4`}>
                  {t('friends.startConnecting', currentLanguage)}
                </p>
                <button
                  onClick={() => setActiveTab('find')}
                  className="mt-4 px-6 py-2 bg-heritage-700 text-white rounded-lg hover:bg-heritage-800 transition-colors"
                >
                  {t('friends.tabFind', currentLanguage)}
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {friends.map(friend => (
                  <motion.div
                    key={friend.friend_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`${isDark ? 'bg-neutral-800' : 'bg-white'} rounded-xl p-4 shadow-md`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full ${isDark ? 'bg-neutral-700' : 'bg-neutral-200'} flex items-center justify-center`}>
                          <Users className={`w-6 h-6 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`} />
                        </div>
                        <div>
                          <h3 className={`font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                            {friend.friend_username}
                          </h3>
                          <button
                            onClick={() => handleViewDiscoveries(friend)}
                            className={`text-sm ${isDark ? 'text-heritage-400 hover:text-heritage-300' : 'text-heritage-700 hover:text-heritage-800'} flex items-center gap-1 transition-colors`}
                          >
                            <MapPin className="w-4 h-4" />
                            {friend.total_discoveries || 0} {t('friends.discoveries', currentLanguage)}
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveFriend(friend.friend_id, friend.friend_username)}
                        className="text-red-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <UserMinus className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Find Friends Tab */}
        {activeTab === 'find' && (
          <div>
            <div className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={t('friends.searchPlaceholder', currentLanguage)}
                  className={`flex-1 px-4 py-3 rounded-lg ${
                    isDark ? 'bg-neutral-800 text-white border-neutral-700' : 'bg-white text-neutral-900 border-neutral-300'
                  } border focus:ring-2 focus:ring-heritage-500 focus:outline-none`}
                />
                <button
                  onClick={handleSearch}
                  disabled={loading || !searchTerm.trim()}
                  className="bg-heritage-700 hover:bg-heritage-800 text-white px-4 md:px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  <span className="hidden md:inline">{t('friends.tabFind', currentLanguage)}</span>
                </button>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="grid gap-4">
                {searchResults.map(user => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`${isDark ? 'bg-neutral-800' : 'bg-white'} rounded-xl p-4 shadow-md flex items-center justify-between`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full ${isDark ? 'bg-neutral-700' : 'bg-neutral-200'} flex items-center justify-center`}>
                        <Users className={`w-6 h-6 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`} />
                      </div>
                      <div>
                        <h3 className={`font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                          {user.username}
                        </h3>
                        <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                          {user.total_discoveries || 0} {t('friends.discoveries', currentLanguage)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSendRequest(user.id, user.username)}
                      className="bg-heritage-700 hover:bg-heritage-800 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      {t('friends.addFriend', currentLanguage)}
                    </button>
                  </motion.div>
                ))}
              </div>
            )}

            {searchTerm && searchResults.length === 0 && !loading && (
              <div className={`text-center py-12 ${isDark ? 'bg-neutral-800' : 'bg-white'} rounded-xl`}>
                <Search className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-neutral-600' : 'text-neutral-300'}`} />
                <p className={`text-lg font-semibold ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                  {t('friends.noResults', currentLanguage)}
                </p>
                <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'} mt-2`}>
                  {t('friends.tryDifferentSearch', currentLanguage)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            {/* Incoming Requests */}
            <div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'} mb-4`}>
                {t('friends.incomingRequests', currentLanguage)} ({pendingRequests.length})
              </h2>

              {pendingRequests.length === 0 ? (
                <div className={`text-center py-8 ${isDark ? 'bg-neutral-800' : 'bg-white'} rounded-xl`}>
                  <p className={`${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                    {t('friends.noPendingRequests', currentLanguage)}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-neutral-500'} mt-2`}>
                    {t('friends.noOneWaiting', currentLanguage)}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {pendingRequests.map(request => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`${isDark ? 'bg-neutral-800' : 'bg-white'} rounded-xl p-4 shadow-md flex items-center justify-between`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full ${isDark ? 'bg-neutral-700' : 'bg-neutral-200'} flex items-center justify-center`}>
                          <Users className={`w-6 h-6 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`} />
                        </div>
                        <div>
                          <h3 className={`font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                            {request.requester_username}
                          </h3>
                          <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                            {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptRequest(request.id, request.requester_username)}
                          className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request.id)}
                          className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Sent Requests */}
            <div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'} mb-4`}>
                {t('friends.sentRequests', currentLanguage)} ({sentRequests.length})
              </h2>

              {sentRequests.length === 0 ? (
                <div className={`text-center py-8 ${isDark ? 'bg-neutral-800' : 'bg-white'} rounded-xl`}>
                  <p className={`${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                    {t('friends.noSentRequests', currentLanguage)}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-neutral-500'} mt-2`}>
                    {t('friends.notWaitingForAnyone', currentLanguage)}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {sentRequests.map(request => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`${isDark ? 'bg-neutral-800' : 'bg-white'} rounded-xl p-4 shadow-md flex items-center justify-between`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full ${isDark ? 'bg-neutral-700' : 'bg-neutral-200'} flex items-center justify-center`}>
                          <Users className={`w-6 h-6 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`} />
                        </div>
                        <div>
                          <h3 className={`font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                            {request.recipient_username}
                          </h3>
                          <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                            {currentLanguage === 'ro' ? 'În așteptare' : currentLanguage === 'hu' ? 'Várakozás' : 'Pending'}
                          </p>
                        </div>
                      </div>
                      <Clock className={`w-5 h-5 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`} />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Friend Discoveries Modal */}
      <AnimatePresence>
        {selectedFriend && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={handleCloseDiscoveries}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`${isDark ? 'bg-neutral-800' : 'bg-white'} rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden`}
            >
              <div className={`${isDark ? 'bg-neutral-900' : 'bg-heritage-100'} px-6 py-4 flex items-center justify-between border-b ${isDark ? 'border-neutral-700' : 'border-heritage-200'}`}>
                <div>
                  <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                    {selectedFriend.friend_username} - {t('friends.discoveries', currentLanguage)}
                  </h2>
                  <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                    {friendDiscoveries.length} {friendDiscoveries.length === 1 ? t('friends.discovery', currentLanguage) : t('friends.discoveries', currentLanguage)}
                  </p>
                </div>
                <button
                  onClick={handleCloseDiscoveries}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-neutral-700' : 'hover:bg-heritage-200'} transition-colors`}
                >
                  <X className={`w-6 h-6 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`} />
                </button>
              </div>
              
              <div className="overflow-y-auto max-h-[calc(80vh-5rem)] p-6">
                {loadingDiscoveries ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader className={`w-8 h-8 animate-spin ${isDark ? 'text-heritage-400' : 'text-heritage-700'}`} />
                  </div>
                ) : friendDiscoveries.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPin className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`} />
                    <p className={`${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                      {t('friends.noDiscoveriesYet', currentLanguage)}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {friendDiscoveries.map((discovery) => (
                      <motion.div
                        key={discovery.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`${isDark ? 'bg-neutral-700' : 'bg-heritage-50'} rounded-lg p-4 border ${isDark ? 'border-neutral-600' : 'border-heritage-200'}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${isDark ? 'bg-heritage-900/50' : 'bg-heritage-200'}`}>
                            <MapPin className={`w-5 h-5 ${isDark ? 'text-heritage-400' : 'text-heritage-700'}`} />
                          </div>
                          <div className="flex-1">
                            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                              {discovery.nodes?.title || 'Unknown Location'}
                            </h3>
                            <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                              {discovery.nodes?.category || 'Uncategorized'}
                            </p>
                            <p className={`text-xs mt-1 ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>
                              {new Date(discovery.discovered_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default FriendsPage;
