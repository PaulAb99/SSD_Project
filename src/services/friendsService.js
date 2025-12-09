import { supabase } from '../lib/supabase';

/**
 * Search for users by username
 */
export async function searchUsers(searchTerm) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username')
      .ilike('username', `%${searchTerm}%`)
      .limit(20);

    if (error) throw error;

    // Get discovery counts for each user
    const usersWithStats = await Promise.all(
      (data || []).map(async (user) => {
        const { count } = await supabase
          .from('user_discoveries')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
        return {
          ...user,
          total_discoveries: count || 0
        };
      })
    );

    return { success: true, users: usersWithStats };
  } catch (error) {
    console.error('Error searching users:', error);
    return { success: false, error: error.message, users: [] };
  }
}

/**
 * Send a friend request
 */
export async function sendFriendRequest(friendId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check if friendship already exists
    const { data: existing } = await supabase
      .from('friendships')
      .select('*')
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
      .single();

    if (existing) {
      return { success: false, error: 'Friend request already exists' };
    }

    const { data, error } = await supabase
      .from('friendships')
      .insert({
        user_id: user.id,
        friend_id: friendId,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, friendship: data };
  } catch (error) {
    console.error('Error sending friend request:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get pending friend requests (incoming)
 */
export async function getPendingRequests() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('recipient_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, requests: data || [] };
  } catch (error) {
    console.error('Error getting pending requests:', error);
    return { success: false, error: error.message, requests: [] };
  }
}

/**
 * Get sent friend requests (outgoing)
 */
export async function getSentRequests() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('requester_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, requests: data || [] };
  } catch (error) {
    console.error('Error getting sent requests:', error);
    return { success: false, error: error.message, requests: [] };
  }
}

/**
 * Accept a friend request
 */
export async function acceptFriendRequest(friendshipId) {
  try {
    const { data, error } = await supabase
      .from('friendships')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', friendshipId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, friendship: data };
  } catch (error) {
    console.error('Error accepting friend request:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Reject a friend request
 */
export async function rejectFriendRequest(friendshipId) {
  try {
    const { data, error } = await supabase
      .from('friendships')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', friendshipId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, friendship: data };
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Remove a friend (delete friendship)
 */
export async function removeFriend(friendId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Delete both directions of friendship
    const { error } = await supabase
      .from('friendships')
      .delete()
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error removing friend:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get user's friends list
 */
export async function getFriendsList() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('friends_list')
      .select('*')
      .eq('user_id', user.id)
      .order('friends_since', { ascending: false });

    if (error) throw error;

    // Also get reverse relationships
    const { data: reverseFriends, error: reverseError } = await supabase
      .from('friendships')
      .select(`
        user_id,
        created_at,
        profiles:user_id (
          id,
          username
        )
      `)
      .eq('friend_id', user.id)
      .eq('status', 'accepted');

    if (reverseError) throw reverseError;

    // Get discovery counts for reverse friends
    const reverseFriendsWithStats = await Promise.all(
      (reverseFriends || []).map(async (f) => {
        const { count } = await supabase
          .from('user_discoveries')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', f.user_id);
        
        return {
          friend_id: f.user_id,
          friend_username: f.profiles?.username,
          total_discoveries: count || 0,
          friends_since: f.created_at
        };
      })
    );

    // Combine and format friends
    const allFriends = [
      ...(data || []).map(f => ({
        friend_id: f.friend_id,
        friend_username: f.friend_username,
        total_discoveries: f.total_discoveries || 0,
        friends_since: f.friends_since
      })),
      ...reverseFriendsWithStats
    ];

    // Remove duplicates
    const uniqueFriends = Array.from(
      new Map(allFriends.map(f => [f.friend_id, f])).values()
    );

    return { success: true, friends: uniqueFriends };
  } catch (error) {
    console.error('Error getting friends list:', error);
    return { success: false, error: error.message, friends: [] };
  }
}

/**
 * Check friendship status with a user
 */
export async function checkFriendshipStatus(friendId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('friendships')
      .select('*')
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return { success: true, status: 'none', friendship: null };
    }

    // Determine status from user's perspective
    let status = data.status;
    if (data.status === 'pending' && data.friend_id === user.id) {
      status = 'incoming';
    } else if (data.status === 'pending' && data.user_id === user.id) {
      status = 'outgoing';
    }

    return { success: true, status, friendship: data };
  } catch (error) {
    console.error('Error checking friendship status:', error);
    return { success: false, error: error.message, status: 'error', friendship: null };
  }
}

/**
 * Get friends count
 */
export async function getFriendsCount() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { count, error } = await supabase
      .from('friendships')
      .select('*', { count: 'exact', head: true })
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .eq('status', 'accepted');

    if (error) throw error;

    // Divide by 2 because friendships are bidirectional
    return { success: true, count: Math.floor((count || 0) / 2) };
  } catch (error) {
    console.error('Error getting friends count:', error);
    return { success: false, error: error.message, count: 0 };
  }
}

/**
 * Get discoveries for a specific friend
 */
export async function getFriendDiscoveries(friendId) {
  try {
    const { data, error } = await supabase
      .from('user_discoveries')
      .select(`
        id,
        discovered_at,
        nodes:node_id (
          id,
          title,
          category
        )
      `)
      .eq('user_id', friendId)
      .order('discovered_at', { ascending: false });

    if (error) throw error;

    return { success: true, discoveries: data || [] };
  } catch (error) {
    console.error('Error fetching friend discoveries:', error);
    return { success: false, error: error.message, discoveries: [] };
  }
}
