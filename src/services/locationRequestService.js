import { supabase } from '../lib/supabaseClient';

export async function submitLocationRequest(requestData) {
  try {
    const { data, error } = await supabase
      .from('location_requests')
      .insert([requestData])
      .select()
      .single();

    if (error) {
      console.error("Error submitting location request:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error submitting location request:", error);
    return { success: false, error: error.message };
  }
}

export async function getUserLocationRequests(userId) {
  try {
    const { data, error } = await supabase
      .from('location_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching user location requests:", error);
      return [];
    }

    return data;
  } catch (error) {
    console.error("Unexpected error fetching location requests:", error);
    return [];
  }
}

export async function getAllLocationRequests() {
  try {
    const { data, error } = await supabase
      .from('location_requests')
      .select(`
        *,
        profiles:user_id (
          username,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching all location requests:", error);
      return [];
    }

    return data;
  } catch (error) {
    console.error("Unexpected error fetching all location requests:", error);
    return [];
  }
}

export async function updateLocationRequestStatus(requestId, status, adminNotes = null) {
  try {
    const updates = {
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: (await supabase.auth.getUser()).data.user?.id
    };

    if (adminNotes) {
      updates.admin_notes = adminNotes;
    }

    const { data, error } = await supabase
      .from('location_requests')
      .update(updates)
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      console.error("Error updating location request:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error updating location request:", error);
    return { success: false, error: error.message };
  }
}

export async function uploadLocationPhoto(file, userId, requestId) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${requestId}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('location-requests')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error("Error uploading photo:", error);
      return { success: false, error: error.message };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('location-requests')
      .getPublicUrl(fileName);

    return { success: true, url: publicUrl, path: fileName };
  } catch (error) {
    console.error("Unexpected error uploading photo:", error);
    return { success: false, error: error.message };
  }
}

export async function uploadLocationAudio(file, userId, requestId) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${requestId}/audio.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('location-requests')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error("Error uploading audio:", error);
      return { success: false, error: error.message };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('location-requests')
      .getPublicUrl(fileName);

    return { success: true, url: publicUrl, path: fileName };
  } catch (error) {
    console.error("Unexpected error uploading audio:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteLocationPhoto(filePath) {
  try {
    const { error } = await supabase.storage
      .from('location-requests')
      .remove([filePath]);

    if (error) {
      console.error("Error deleting photo:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error deleting photo:", error);
    return { success: false, error: error.message };
  }
}
