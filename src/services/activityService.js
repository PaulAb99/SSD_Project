import { supabase } from '../lib/supabase';

/**
 * Get activity feed (user's activities + friends' activities)
 */
export async function getActivityFeed(limit = 50) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .rpc('get_activity_feed', { 
        p_user_id: user.id,
        p_limit: limit 
      });

    if (error) throw error;

    return { success: true, activities: data || [] };
  } catch (error) {
    console.error('Error getting activity feed:', error);
    return { success: false, error: error.message, activities: [] };
  }
}

/**
 * Get user's own activities
 */
export async function getUserActivities(userId, limit = 20) {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select(`
        *,
        profiles:user_id (username, avatar_url)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { success: true, activities: data || [] };
  } catch (error) {
    console.error('Error getting user activities:', error);
    return { success: false, error: error.message, activities: [] };
  }
}

/**
 * Create a discovery activity (automatically triggered by database trigger)
 */
export async function createDiscoveryActivity(nodeId, nodeTitle, nodeDescription, nodeData) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('activities')
      .insert({
        user_id: user.id,
        activity_type: 'discovery',
        node_id: nodeId,
        title: `Discovered ${nodeTitle}`,
        description: nodeDescription?.substring(0, 200) || '',
        metadata: {
          category: nodeData?.category,
          historical_period: nodeData?.historicalPeriod
        },
        is_public: true
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, activity: data };
  } catch (error) {
    console.error('Error creating discovery activity:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create an achievement activity
 */
export async function createAchievementActivity(title, description, metadata = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('activities')
      .insert({
        user_id: user.id,
        activity_type: 'achievement',
        title,
        description,
        metadata,
        is_public: true
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, activity: data };
  } catch (error) {
    console.error('Error creating achievement activity:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a review activity
 */
export async function createReviewActivity(nodeId, nodeTitle, rating, comment) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('activities')
      .insert({
        user_id: user.id,
        activity_type: 'review',
        node_id: nodeId,
        title: `Reviewed ${nodeTitle}`,
        description: comment?.substring(0, 200) || '',
        metadata: { rating },
        is_public: true
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, activity: data };
  } catch (error) {
    console.error('Error creating review activity:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a friend added activity
 */
export async function createFriendAddedActivity(friendUsername) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('activities')
      .insert({
        user_id: user.id,
        activity_type: 'friend_added',
        title: `Connected with ${friendUsername}`,
        description: `Now friends with ${friendUsername}`,
        is_public: true
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, activity: data };
  } catch (error) {
    console.error('Error creating friend added activity:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a custom activity
 */
export async function createCustomActivity(title, description, metadata = {}, isPublic = true) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('activities')
      .insert({
        user_id: user.id,
        activity_type: 'custom',
        title,
        description,
        metadata,
        is_public: isPublic
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, activity: data };
  } catch (error) {
    console.error('Error creating custom activity:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete an activity
 */
export async function deleteActivity(activityId) {
  try {
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', activityId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error deleting activity:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update activity visibility
 */
export async function updateActivityVisibility(activityId, isPublic) {
  try {
    const { data, error } = await supabase
      .from('activities')
      .update({ is_public: isPublic })
      .eq('id', activityId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, activity: data };
  } catch (error) {
    console.error('Error updating activity visibility:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get activity statistics
 */
export async function getActivityStats() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('activities')
      .select('activity_type')
      .eq('user_id', user.id);

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      discoveries: data?.filter(a => a.activity_type === 'discovery').length || 0,
      achievements: data?.filter(a => a.activity_type === 'achievement').length || 0,
      reviews: data?.filter(a => a.activity_type === 'review').length || 0,
      friendsAdded: data?.filter(a => a.activity_type === 'friend_added').length || 0
    };

    return { success: true, stats };
  } catch (error) {
    console.error('Error getting activity stats:', error);
    return { success: false, error: error.message, stats: null };
  }
}
