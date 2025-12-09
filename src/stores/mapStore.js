import { create } from 'zustand';

const useMapStore = create((set, get) => ({
  userLocation: null,
  selectedNode: null,
  discoveredNodes: new Set(),
  culturalNodes: [],
  mapCenter: [45.7489, 21.2087],
  mapZoom: 14,
  map: null,
  clearRouteFunction: null,
  createRouteFunction: null,
  
  // Translation state
  currentLanguage: 'en',
  translatedNodes: {}, // { nodeId: { language: translatedContent } }
  translatedUI: {}, // { language: { key: translatedValue } }
  
  // Reviews state
  nodeReviews: {}, // { nodeId: { reviews: [], averageRating: 0, totalReviews: 0 } }
  
  setMap: (map) => set({ map: map }),
  setClearRouteFunction: (fn) => set({ clearRouteFunction: fn }),
  setCreateRouteFunction: (fn) => set({ createRouteFunction: fn }),
  setCulturalNodes: (nodes) => set({ culturalNodes: nodes }),
  setUserLocation: (location) => set({ userLocation: location }),
  setSelectedNode: (node) => set({ selectedNode: node }),
  addDiscoveredNode: (nodeId) => set((state) => ({
    discoveredNodes: new Set([...state.discoveredNodes, nodeId])
  })),
  clearDiscoveredNodes: () => set({ discoveredNodes: new Set() }),
  setMapCenter: (center) => set({ mapCenter: center }),
  setMapZoom: (zoom) => set({ mapZoom: zoom }),
  clearSelectedNode: () => set({ selectedNode: null }),
  
  // Translation methods
  setCurrentLanguage: (language) => set({ currentLanguage: language }),
  
  setTranslatedNode: (nodeId, language, translatedContent) =>
    set((state) => ({
      translatedNodes: {
        ...state.translatedNodes,
        [nodeId]: {
          ...state.translatedNodes[nodeId],
          [language]: translatedContent
        }
      }
    })),
  
  setTranslatedUI: (language, translations) =>
    set((state) => ({
      translatedUI: {
        ...state.translatedUI,
        [language]: translations
      }
    })),
  
  getNodeInLanguage: (nodeId, language) => {
    const state = get();
    if (language === 'en') {
      return state.culturalNodes.find(n => n.id === nodeId);
    }
    return state.translatedNodes[nodeId]?.[language];
  },
  
  // Reviews methods
  setNodeReviews: (nodeId, reviews, averageRating, totalReviews) =>
    set((state) => ({
      nodeReviews: {
        ...state.nodeReviews,
        [nodeId]: { reviews, averageRating, totalReviews }
      }
    })),
  
  addReviewToNode: (nodeId, review) =>
    set((state) => {
      const currentNodeReviews = state.nodeReviews[nodeId] || { reviews: [], averageRating: 0, totalReviews: 0 };
      const updatedReviews = [review, ...currentNodeReviews.reviews];
      const totalRating = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = Math.round((totalRating / updatedReviews.length) * 10) / 10;
      
      return {
        nodeReviews: {
          ...state.nodeReviews,
          [nodeId]: {
            reviews: updatedReviews,
            averageRating,
            totalReviews: updatedReviews.length
          }
        }
      };
    }),
  
  updateReviewInNode: (nodeId, updatedReview) =>
    set((state) => {
      const currentNodeReviews = state.nodeReviews[nodeId];
      if (!currentNodeReviews) return state;
      
      const updatedReviews = currentNodeReviews.reviews.map(r => 
        r.id === updatedReview.id ? updatedReview : r
      );
      const totalRating = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = Math.round((totalRating / updatedReviews.length) * 10) / 10;
      
      return {
        nodeReviews: {
          ...state.nodeReviews,
          [nodeId]: {
            reviews: updatedReviews,
            averageRating,
            totalReviews: updatedReviews.length
          }
        }
      };
    }),
  
  removeReviewFromNode: (nodeId, reviewId) =>
    set((state) => {
      const currentNodeReviews = state.nodeReviews[nodeId];
      if (!currentNodeReviews) return state;
      
      const updatedReviews = currentNodeReviews.reviews.filter(r => r.id !== reviewId);
      const totalRating = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = updatedReviews.length > 0 
        ? Math.round((totalRating / updatedReviews.length) * 10) / 10 
        : 0;
      
      return {
        nodeReviews: {
          ...state.nodeReviews,
          [nodeId]: {
            reviews: updatedReviews,
            averageRating,
            totalReviews: updatedReviews.length
          }
        }
      };
    }),
}));

export default useMapStore;
