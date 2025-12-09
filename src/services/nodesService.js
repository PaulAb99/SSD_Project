import { supabase } from '../lib/supabaseClient';

export async function fetchCulturalNodes() {
  try {
    const { data, error } = await supabase
      .from('cultural_nodes')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Error fetching cultural nodes:", error);
      return [];
    }

    return data.map(node => ({
      id: node.id,
      title: node.title,
      slug: node.slug,
      latitude: parseFloat(node.latitude),
      longitude: parseFloat(node.longitude),
      proximityRadius: node.proximity_radius,
      description: node.description,
      historicalPeriod: node.historical_period,
      category: node.category,
      audioUrl: node.audio_url,
      audioDuration: node.audio_duration,
      primaryImageUrl: node.primary_image_url,
      videos: node.videos || [],
      images: node.images || []
    }));
  } catch (error) {
    console.error("Unexpected error fetching nodes:", error);
    return [];
  }
}

export async function createCulturalNode(nodeData) {
  try {
    const { data, error } = await supabase
      .from('cultural_nodes')
      .insert([{
        title: nodeData.title,
        slug: nodeData.slug,
        latitude: nodeData.latitude,
        longitude: nodeData.longitude,
        proximity_radius: nodeData.proximityRadius,
        description: nodeData.description,
        historical_period: nodeData.historicalPeriod,
        category: nodeData.category,
        audio_url: nodeData.audioUrl,
        audio_duration: nodeData.audioDuration,
        primary_image_url: nodeData.primaryImageUrl,
        videos: nodeData.videos || [],
        images: nodeData.images || []
      }])
      .select()
      .single();

    if (error) {
      console.error("Error creating cultural node:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error creating node:", error);
    return { success: false, error: error.message };
  }
}

export async function saveDiscovery(userId, nodeId) {
  try {
    const { data, error } = await supabase
      .from('user_discoveries')
      .insert([{
        user_id: userId,
        node_id: nodeId
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: true, message: "Already discovered" };
      }
      console.error("Error saving discovery:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error saving discovery:", error);
    return { success: false, error: error.message };
  }
}

export async function fetchUserDiscoveries(userId) {
  try {
    const { data, error } = await supabase
      .from('user_discoveries')
      .select('node_id')
      .eq('user_id', userId);

    if (error) {
      console.error("Error fetching discoveries:", error);
      return [];
    }

    return data.map(d => d.node_id);
  } catch (error) {
    console.error("Unexpected error fetching discoveries:", error);
    return [];
  }
}