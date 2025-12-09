import { supabase } from '../lib/supabaseClient';

export async function fetchLeaderboard(limit = 100) {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .order('points', { ascending: false })
      .order('discoveries_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching leaderboard:", error);
      return [];
    }

    return data.map((entry, index) => ({
      rank: index + 1,
      id: entry.id,
      username: entry.username,
      points: entry.points,
      discoveriesCount: entry.discoveries_count,
      createdAt: entry.created_at
    }));
  } catch (error) {
    console.error("Unexpected error fetching leaderboard:", error);
    return [];
  }
}

export async function getUserRank(userId) {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .order('points', { ascending: false })
      .order('discoveries_count', { ascending: false });

    if (error) {
      console.error("Error fetching user rank:", error);
      return null;
    }

    const userIndex = data.findIndex(entry => entry.id === userId);
    if (userIndex === -1) return null;

    return {
      rank: userIndex + 1,
      points: data[userIndex].points,
      discoveriesCount: data[userIndex].discoveries_count
    };
  } catch (error) {
    console.error("Unexpected error fetching user rank:", error);
    return null;
  }
}

export async function getUserDiscoveries(userId) {
  try {
    console.log('🔍 Fetching discoveries for user:', userId);
    
    const { data, error } = await supabase
      .from('user_discoveries')
      .select(`
        node_id,
        discovered_at,
        cultural_nodes (
          title,
          slug,
          latitude,
          longitude,
          category,
          primary_image_url
        )
      `)
      .eq('user_id', userId)
      .order('discovered_at', { ascending: false });

    if (error) {
      console.error("Error fetching user discoveries:", error);
      console.error("Error details:", error.message, error.details, error.hint);
      return [];
    }

    console.log('✅ Discoveries fetched:', data?.length || 0);
    console.log('Data:', data);

    return data.map(discovery => ({
      nodeId: discovery.node_id,
      discoveredAt: discovery.discovered_at,
      title: discovery.cultural_nodes?.title || 'Unknown Location',
      slug: discovery.cultural_nodes?.slug || '',
      latitude: discovery.cultural_nodes?.latitude || 0,
      longitude: discovery.cultural_nodes?.longitude || 0,
      category: discovery.cultural_nodes?.category || '',
      imageUrl: discovery.cultural_nodes?.primary_image_url || ''
    }));
  } catch (error) {
    console.error("Unexpected error fetching user discoveries:", error);
    return [];
  }
}
