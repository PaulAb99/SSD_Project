import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MapContainer from '../components/Map/MapContainer';
import NodeModal from '../components/Node/NodeModal';
import AudioPlayer from '../components/Audio/AudioPlayer';
import OnboardingOverlay from '../components/Onboarding/OnboardingOverlay';
import useProximity from '../hooks/useProximity';
import useMapStore from '../stores/mapStore';
import { fetchCulturalNodes, fetchUserDiscoveries } from '../services/nodesService';
import { checkAvailableModels } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { Bug } from 'lucide-react';

function MapPage() {
  const mapRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useAuth();
  const setCulturalNodes = useMapStore((state) => state.setCulturalNodes);
  const addDiscoveredNode = useMapStore((state) => state.addDiscoveredNode);
  useProximity();

  useEffect(() => {
    async function loadNodes() {
      const nodes = await fetchCulturalNodes();
      setCulturalNodes(nodes);

      // Load user's discoveries if logged in
      if (user) {
        const discoveredNodeIds = await fetchUserDiscoveries(user.id);
        discoveredNodeIds.forEach((nodeId) => {
          addDiscoveredNode(nodeId);
        });
      }
    }
    loadNodes();
    
    // Check available models on mount (only once)
    checkAvailableModels();
  }, [setCulturalNodes, addDiscoveredNode, user]);

  return (
    <div className="relative">
      <MapContainer />
      <NodeModal />
      <AudioPlayer />
      <OnboardingOverlay />
      
    </div>
  );
}

export default MapPage;