import { supabase } from '../lib/supabaseClient';

/**
 * Get all reviews for a specific node
 * @param {string} nodeId - The ID of the cultural node
 * @returns {Promise<{success: boolean, reviews?: Array, error?: string}>}
 */
export async function getReviewsForNode(nodeId) {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('node_id', nodeId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, reviews: data || [] };
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get average rating for a specific node
 * @param {string} nodeId - The ID of the cultural node
 * @returns {Promise<{success: boolean, averageRating?: number, totalReviews?: number, error?: string}>}
 */
export async function getNodeRating(nodeId) {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('node_id', nodeId);

    if (error) throw error;

    if (!data || data.length === 0) {
      return { success: true, averageRating: 0, totalReviews: 0 };
    }

    const totalRating = data.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / data.length;

    return { 
      success: true, 
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalReviews: data.length 
    };
  } catch (error) {
    console.error('Error fetching node rating:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get user's review for a specific node
 * @param {string} nodeId - The ID of the cultural node
 * @param {string} userId - The ID of the user
 * @returns {Promise<{success: boolean, review?: Object, error?: string}>}
 */
export async function getUserReviewForNode(nodeId, userId) {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('node_id', nodeId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw error;
    }

    return { success: true, review: data || null };
  } catch (error) {
    console.error('Error fetching user review:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a new review
 * @param {string} nodeId - The ID of the cultural node
 * @param {string} userId - The ID of the user
 * @param {string} username - The username of the reviewer
 * @param {number} rating - Rating from 1 to 5
 * @param {string} reviewText - Optional review text
 * @returns {Promise<{success: boolean, review?: Object, error?: string}>}
 */
export async function createReview(nodeId, userId, username, rating, reviewText = '') {
  try {
    if (!nodeId || !userId || !username) {
      throw new Error('Missing required fields');
    }

    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert([{
        node_id: nodeId,
        user_id: userId,
        username: username,
        rating: rating,
        review_text: reviewText
      }])
      .select()
      .single();

    if (error) throw error;

    return { success: true, review: data };
  } catch (error) {
    console.error('Error creating review:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update an existing review
 * @param {string} reviewId - The ID of the review to update
 * @param {number} rating - New rating from 1 to 5
 * @param {string} reviewText - New review text
 * @returns {Promise<{success: boolean, review?: Object, error?: string}>}
 */
export async function updateReview(reviewId, rating, reviewText = '') {
  try {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const { data, error } = await supabase
      .from('reviews')
      .update({
        rating: rating,
        review_text: reviewText
      })
      .eq('id', reviewId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, review: data };
  } catch (error) {
    console.error('Error updating review:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a review
 * @param {string} reviewId - The ID of the review to delete
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteReview(reviewId) {
  try {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error deleting review:', error);
    return { success: false, error: error.message };
  }
}
