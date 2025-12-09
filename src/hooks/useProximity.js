import { useState, useEffect, useRef } from 'react';
import { isWithinProximity } from '../utils/distance';
import useMapStore from '../stores/mapStore';
import { saveDiscovery } from '../services/nodesService';
import { useAuth } from '../contexts/AuthContext';

function useProximity() {
  const { user } = useAuth();
  const userLocation = useMapStore((state) => state.userLocation);
  const culturalNodes = useMapStore((state) => state.culturalNodes);
  const addDiscoveredNode = useMapStore((state) => state.addDiscoveredNode);
  const [nearbyNodes, setNearbyNodes] = useState([]);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!userLocation) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (culturalNodes.length === 0) {
      return;
    }

    const checkProximity = () => {
      console.log("Checking proximity at:", new Date().toLocaleTimeString());
      
      // Get fresh state
      const currentDiscoveredNodes = useMapStore.getState().discoveredNodes;
      
      const nearby = culturalNodes.filter((node) => {
        const isNear = isWithinProximity(
          userLocation.lat,
          userLocation.lng,
          node.latitude,
          node.longitude,
          node.proximityRadius
        );

        if (isNear) {
          const wasDiscovered = currentDiscoveredNodes.has(node.id);
          if (!wasDiscovered) {
            console.log("🎉 NEW NODE DISCOVERED:", node.title);
            addDiscoveredNode(node.id);
            
            // Save discovery to database if user is logged in
            if (user) {
              saveDiscovery(user.id, node.id).then((result) => {
                if (result.success) {
                  console.log("✅ Discovery saved to database:", node.title);
                } else {
                  console.error("❌ Failed to save discovery:", result.error);
                }
              });
            }
            
            // Haptic feedback
            if ('vibrate' in navigator) {
              navigator.vibrate([200, 100, 200]);
            }
          }
        }

        return isNear;
      });

      setNearbyNodes(nearby);
    };

    // Initial check
    checkProximity();

    // Set up 10-second interval
    // intervalRef.current = setInterval(checkProximity, 10000);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [userLocation, addDiscoveredNode]);

  return nearbyNodes;
}

export default useProximity;