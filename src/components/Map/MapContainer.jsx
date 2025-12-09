import React, { useEffect, useState, useRef } from 'react';
import { MapContainer as LeafletMap, TileLayer, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, MapPin as MapPinIcon, Map, MessageCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import NodeMarker from './NodeMarker';
import UserLocation from './UserLocation';
import CustomPathModal from './CustomPathModal';
import ChatbotModal from './ChatbotModal';
import useMapStore from '../../stores/mapStore';
import useRouting from '../../hooks/useRouting';
import useGeolocation from '../../hooks/useGeolocation';
import { useTheme } from '../../contexts/ThemeContext';
import { t } from '../../utils/uiTranslations';
import 'leaflet/dist/leaflet.css';

function MapContainer({ mapRef: externalMapRef }) {
  const { isDark } = useTheme();
  const mapRef = useRef(null);
  const { error, loading } = useGeolocation();
  const userLocation = useMapStore((state) => state.userLocation);
  const culturalNodes = useMapStore((state) => state.culturalNodes);
  const discoveredNodes = useMapStore((state) => state.discoveredNodes);
  const mapCenter = useMapStore((state) => state.mapCenter);
  const mapZoom = useMapStore((state) => state.mapZoom);
  const currentLanguage = useMapStore((state) => state.currentLanguage);
  const setMap = useMapStore((state) => state.setMap);
  const setClearRouteFunction = useMapStore((state) => state.setClearRouteFunction);
  const setCreateRouteFunction = useMapStore((state) => state.setCreateRouteFunction);
  const { createRoute, clearRoute } = useRouting(mapRef);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isCustomPathModalOpen, setIsCustomPathModalOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  // Expose map ref to parent if provided
  useEffect(() => {
    if (externalMapRef) {
      externalMapRef.current = mapRef.current;
    }
  }, [externalMapRef]);

  // Store map instance in global store when available
  useEffect(() => {
    if (mapRef.current) {
      setMap(mapRef.current);
    }
  }, [mapRef.current, setMap]);

  // Store clear route function globally
  useEffect(() => {
    if (clearRoute) {
      setClearRouteFunction(clearRoute);
    }
  }, [clearRoute, setClearRouteFunction]);

  // Store create route function globally
  useEffect(() => {
    if (createRoute) {
      setCreateRouteFunction(createRoute);
    }
  }, [createRoute, setCreateRouteFunction]);

  useEffect(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.flyTo([userLocation.lat, userLocation.lng], 16, {
        duration: 1.5
      });
    }
  }, [userLocation]);

  const handleRecenter = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.flyTo([userLocation.lat, userLocation.lng], 16, {
        duration: 1
      });
    }
  };

  const handleFindPath = async () => {
    if (!userLocation) {
      await Swal.fire({
        title: t('route.locationRequired', currentLanguage),
        text: t('route.enableLocationAccess', currentLanguage),
        icon: 'warning',
        confirmButtonColor: '#6f4e35',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#000000'
      });
      return;
    }

    // Get all undiscovered nodes
    const undiscoveredNodes = culturalNodes.filter((node) => !discoveredNodes.has(node.id));

    if (undiscoveredNodes.length === 0) {
      await Swal.fire({
        title: t('route.allDiscovered', currentLanguage),
        text: t('route.congratsAllDiscovered', currentLanguage),
        icon: 'success',
        confirmButtonColor: '#6f4e35',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#000000'
      });
      return;
    }

    const categories = ['Architecture', 'Event', 'Person', 'Artifact', 'Scenic'];
    const categoryTranslations = {
      'Architecture': t('categories.architecture', currentLanguage),
      'Event': t('categories.event', currentLanguage),
      'Person': t('categories.person', currentLanguage),
      'Artifact': t('categories.artifact', currentLanguage),
      'Scenic': t('categories.scenic', currentLanguage)
    };
    const checkboxesHtml = categories.map(category => `
      <div class="flex items-center gap-2 py-1.5">
        <input 
          type="checkbox" 
          id="category-${category}" 
          value="${category}"
          ${selectedCategories.length === 0 || selectedCategories.includes(category) ? 'checked' : ''}
          class="w-4 h-4 text-heritage-600 ${isDark ? 'bg-neutral-700 border-neutral-500' : 'bg-gray-100 border-gray-300'} rounded focus:ring-heritage-500"
        />
        <label for="category-${category}" class="text-sm font-medium ${isDark ? 'text-neutral-100' : 'text-gray-900'}">
          ${categoryTranslations[category]}
        </label>
      </div>
    `).join('');

    // Ask user for route parameters
    const { value: formValues } = await Swal.fire({
      title: t('route.planYourRoute', currentLanguage),
      html: `
        <div class="space-y-4 text-left">
          <div class="${isDark ? 'bg-heritage-900/20 border-heritage-700' : 'bg-heritage-50 border-heritage-200'} p-3 rounded-lg border">
            <label class="block text-sm font-semibold ${isDark ? 'text-neutral-100' : 'text-neutral-900'} mb-2">
              <span class="flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                ${t('route.filterByCategory', currentLanguage)}
              </span>
            </label>
            <p class="text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-600'} mb-2">${t('route.selectLocationTypes', currentLanguage)}</p>
            ${checkboxesHtml}
          </div>
          <div>
            <label class="block text-sm font-semibold ${isDark ? 'text-neutral-100' : 'text-neutral-900'} mb-2">
              ${t('route.howManyLocations', currentLanguage)}
            </label>
            <input 
              id="swal-locations" 
              type="number" 
              min="1" 
              max="${undiscoveredNodes.length}" 
              value="${Math.min(3, undiscoveredNodes.length)}"
              class="w-full px-4 py-2 border ${isDark ? 'border-neutral-600 bg-neutral-700 text-neutral-100' : 'border-neutral-300 bg-white text-neutral-900'} rounded-lg focus:ring-2 focus:ring-heritage-500 focus:border-heritage-500"
            />
            <p class="text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-600'} mt-1">${undiscoveredNodes.length} ${t('route.undiscoveredLocationsAvailable', currentLanguage)}</p>
          </div>
          <div>
            <label class="block text-sm font-semibold ${isDark ? 'text-neutral-100' : 'text-neutral-900'} mb-2">
              ${t('route.howMuchTime', currentLanguage)}
            </label>
            <input 
              id="swal-time" 
              type="number" 
              min="30" 
              max="480" 
              value="90"
              class="w-full px-4 py-2 border ${isDark ? 'border-neutral-600 bg-neutral-700 text-neutral-100' : 'border-neutral-300 bg-white text-neutral-900'} rounded-lg focus:ring-2 focus:ring-heritage-500 focus:border-heritage-500"
            />
            <p class="text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-600'} mt-1">${t('route.includes10Minutes', currentLanguage)}</p>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonColor: '#6f4e35',
      cancelButtonColor: '#6b7280',
      confirmButtonText: t('route.createRoute', currentLanguage),
      cancelButtonText: t('route.cancel', currentLanguage),
      background: isDark ? '#1f2937' : '#ffffff',
      color: isDark ? '#f3f4f6' : '#000000',
      preConfirm: () => {
        const locations = parseInt(document.getElementById('swal-locations').value);
        const time = parseInt(document.getElementById('swal-time').value);
        const selectedCats = categories.filter(category => 
          document.getElementById(`category-${category}`).checked
        );
        
        if (!locations || locations < 1) {
          Swal.showValidationMessage('Please enter at least 1 location');
          return false;
        }
        
        if (locations > undiscoveredNodes.length) {
          Swal.showValidationMessage(`Maximum ${undiscoveredNodes.length} locations available`);
          return false;
        }
        
        if (!time || time < 30) {
          Swal.showValidationMessage('Please enter at least 30 minutes');
          return false;
        }
        
        return { locations, time, categories: selectedCats };
      }
    });

    if (!formValues) {
      return; // User cancelled
    }

    const { locations: requestedLocations, time: availableTime, categories: selectedCats } = formValues;

    // Update the selected categories state
    setSelectedCategories(selectedCats);

    // Re-filter nodes based on selected categories from the form
    let filteredNodes = culturalNodes.filter((node) => !discoveredNodes.has(node.id));
    
    if (selectedCats.length > 0) {
      filteredNodes = filteredNodes.filter((node) => 
        selectedCats.includes(node.category)
      );
    }

    if (filteredNodes.length === 0) {
      await Swal.fire({
        title: t('route.noMatchingLocations', currentLanguage),
        text: t('route.noUndiscoveredMatch', currentLanguage),
        icon: 'info',
        confirmButtonColor: '#6f4e35',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#000000'
      });
      return;
    }

    // Don't pre-limit nodes - let the actual route calculation determine what fits
    const actualLocations = Math.min(requestedLocations, filteredNodes.length);

    // Calculate actual distances using Haversine formula
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371e3; // Earth's radius in meters
      const φ1 = (lat1 * Math.PI) / 180;
      const φ2 = (lat2 * Math.PI) / 180;
      const Δφ = ((lat2 - lat1) * Math.PI) / 180;
      const Δλ = ((lon2 - lon1) * Math.PI) / 180;

      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      return R * c; // Distance in meters
    };

    // Smart node selection: use nearest neighbor to build a cluster
    // This ensures selected nodes are close to each other, not just close to start
    const selectOptimalNodes = (startLat, startLon, nodes, count) => {
      if (nodes.length <= count) {
        return nodes;
      }

      // Strategy: Build a cluster using nearest neighbor from starting point
      const selected = [];
      const remaining = [...nodes];
      let currentLat = startLat;
      let currentLon = startLon;

      for (let i = 0; i < count; i++) {
        // Find nearest unselected node to current position
        let nearestIndex = 0;
        let nearestDistance = Infinity;

        for (let j = 0; j < remaining.length; j++) {
          const distance = calculateDistance(
            currentLat,
            currentLon,
            remaining[j].latitude,
            remaining[j].longitude
          );
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = j;
          }
        }

        // Add nearest node to selection
        const nearestNode = remaining.splice(nearestIndex, 1)[0];
        selected.push(nearestNode);
        
        // Move to this node for next iteration
        currentLat = nearestNode.latitude;
        currentLon = nearestNode.longitude;
      }

      return selected;
    };

    // Select nodes that form a compact cluster for efficient routing
    const selectedNodes = selectOptimalNodes(
      userLocation.lat,
      userLocation.lng,
      filteredNodes,
      actualLocations
    );

    console.log(`🗺️ Creating route to ${selectedNodes.length} locations (${availableTime} min available)`);
    console.log('Selected nodes:', selectedNodes.map(n => n.title));
    
    // Show calculating indicator
    setIsCalculatingRoute(true);
    
    // Create route through selected nodes, passing available time for validation
    const routeResult = await createRoute(userLocation, selectedNodes, availableTime);
    
    // Hide calculating indicator
    setIsCalculatingRoute(false);
    
    // Handle route creation result
    if (routeResult.success) {
      console.log('✅ Route creation successful');
    } else if (routeResult.timeExceeded) {
      // Route exceeded time budget - offer to reduce nodes
      console.log('⚠️ Route exceeded time, attempting with fewer nodes...');
      
      // Calculate how many nodes might fit
      const timePerLocation = 12; // 10 min visit + ~2 min walking average
      const maxPossibleNodes = Math.max(1, Math.floor(availableTime / timePerLocation));
      const reducedNodeCount = Math.min(maxPossibleNodes, selectedNodes.length - 1);
      
      if (reducedNodeCount < 1) {
        await Swal.fire({
          title: t('route.routeTooLong', currentLanguage),
          html: `
            <div class="text-left space-y-2">
              <p class="text-red-600 font-semibold">⚠️ ${t('route.cannotCreateRoute', currentLanguage)}</p>
              <p><strong>${t('route.availableTime', currentLanguage)}:</strong> ${availableTime} ${t('route.minutes', currentLanguage)}</p>
              <p><strong>${t('route.minimumRouteTime', currentLanguage)}:</strong> ~${routeResult.totalTimeMin} ${t('route.minutes', currentLanguage)}</p>
              <p class="text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'} mt-3">${t('route.pleaseTry', currentLanguage)}:</p>
              <ul class="list-disc pl-5 text-sm">
                <li>${t('route.increaseTime', currentLanguage)}</li>
                <li>${t('route.startCloser', currentLanguage)}</li>
              </ul>
            </div>
          `,
          icon: 'error',
          confirmButtonColor: '#6f4e35',
          background: isDark ? '#1f2937' : '#ffffff',
          color: isDark ? '#f3f4f6' : '#000000'
        });
        return;
      }
      
      // Ask user if they want a shorter route
      const { value: accept } = await Swal.fire({
        title: t('route.routeAdjustmentNeeded', currentLanguage),
        html: `
          <div class="text-left space-y-2">
            <p class="text-orange-600 font-semibold">⚠️ ${t('route.theRouteExceeds', currentLanguage).replace('{count}', selectedNodes.length)}</p>
            <p><strong>${t('route.yourTimeBudget', currentLanguage)}:</strong> ${availableTime} ${t('route.minutes', currentLanguage)}</p>
            <p><strong>${t('route.routeWouldRequire', currentLanguage)}:</strong> ${routeResult.totalTimeMin} ${t('route.minutes', currentLanguage)}</p>
            <hr class="my-3 ${isDark ? 'border-neutral-600' : 'border-neutral-300'}">
            <p class="text-green-${isDark ? '400' : '700'} font-semibold">✓ ${t('route.weCanCreate', currentLanguage).replace('{count}', reducedNodeCount).replace('{s}', reducedNodeCount > 1 ? 's' : '')}</p>
            <p class="text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'} mt-2">${t('route.shorterRouteFit', currentLanguage).replace('{time}', availableTime)}</p>
            <p class="text-sm font-semibold ${isDark ? 'text-heritage-400' : 'text-heritage-700'} mt-3">${t('route.wouldYouLike', currentLanguage)}</p>
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#6f4e35',
        cancelButtonColor: '#6b7280',
        confirmButtonText: t('route.yesCreateShorter', currentLanguage),
        cancelButtonText: t('route.noCancel', currentLanguage),
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#000000'
      });
      
      if (accept) {
        // Create route with fewer nodes
        const reducedNodes = selectOptimalNodes(
          userLocation.lat,
          userLocation.lng,
          undiscoveredNodes,
          reducedNodeCount
        );
        
        console.log(`🔄 Retrying with ${reducedNodes.length} nodes`);
        setIsCalculatingRoute(true);
        const retryResult = await createRoute(userLocation, reducedNodes, availableTime);
        setIsCalculatingRoute(false);
        
        if (retryResult.success) {
          console.log('✅ Shorter route created successfully');
        } else {
          await Swal.fire({
            title: t('route.routeCreationFailed', currentLanguage),
            text: t('route.unableToCreateRoute', currentLanguage),
            icon: 'error',
            confirmButtonColor: '#6f4e35',
            background: isDark ? '#1f2937' : '#ffffff',
            color: isDark ? '#f3f4f6' : '#000000'
          });
        }
      }
    } else {
      console.error('❌ Route creation failed');
      await Swal.fire({
        title: t('route.routeCreationFailed', currentLanguage),
        text: t('route.failedToCreateRoute', currentLanguage),
        icon: 'error',
        confirmButtonColor: '#6f4e35',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#000000'
      });
    }
  };

  const handleMakeCustomPath = () => {
    if (!userLocation) {
      Swal.fire({
        title: t('customPath.enableLocationTitle', currentLanguage),
        text: t('customPath.enableLocationText', currentLanguage),
        icon: 'warning',
        confirmButtonColor: '#6f4e35',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#000000'
      });
      return;
    }

    setIsCustomPathModalOpen(true);
  };

  const handleStartCustomRoute = async (selectedNodes) => {
    if (selectedNodes.length === 0) {
      await Swal.fire({
        title: t('customPath.noNodesSelectedTitle', currentLanguage),
        text: t('customPath.noNodesSelectedText', currentLanguage),
        icon: 'warning',
        confirmButtonColor: '#6f4e35',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#000000'
      });
      return;
    }

    setIsCalculatingRoute(true);
    
    // Create route with selected nodes (no time limit for custom paths)
    const routeResult = await createRoute(userLocation, selectedNodes, null, true);
    
    setIsCalculatingRoute(false);
    
    if (routeResult.success) {
      console.log('✅ Custom route created successfully');
      // Clear custom path mode
      clearCustomPathSelection();
    } else {
      console.error('❌ Custom route creation failed');
      await Swal.fire({
        title: 'Route Creation Failed',
        text: 'Failed to create custom route. Please try again.',
        icon: 'error',
        confirmButtonColor: '#6f4e35',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#000000'
      });
    }
  };

  const handleCloseCustomPathModal = () => {
    setIsCustomPathModalOpen(false);
    // Don't clear selection immediately - let user see their selections
  };

  const handleClearRoute = () => {
    clearRoute();
  };

  return (
    <div className="relative w-full h-screen">
      <LeafletMap
        ref={mapRef}
        center={mapCenter}
        zoom={mapZoom}
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="dark-mode-map"
        />
        <ZoomControl position="bottomright" />
        {userLocation && <UserLocation position={userLocation} />}
        {culturalNodes.map((node) => (
          <NodeMarker key={node.id} node={node} />
        ))}
      </LeafletMap>

      {loading && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-lg shadow-lg z-[1000]">
          <p className="text-sm text-neutral-600">{t('map.locatingYou', currentLanguage)}</p>
        </div>
      )}

      {isCalculatingRoute && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-heritage-700 px-6 py-3 rounded-lg shadow-xl z-[1000] flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
          <p className="text-sm font-semibold text-white">{t('route.calculatingRoute', currentLanguage)}</p>
        </div>
      )}

      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-50 px-4 py-2 rounded-lg shadow-lg z-[1000] border border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {userLocation && (
        <button
          onClick={handleRecenter}
          className="absolute bottom-24 right-4 bg-white p-3 rounded-full shadow-lg hover:bg-heritage-50 transition-colors z-[1000]"
          aria-label="Recenter map"
        >
          <Navigation className="w-5 h-5 text-heritage-700" />
        </button>
      )}

      {userLocation && culturalNodes.length > 0 && (
        <div className="absolute bottom-20 left-2 md:left-4 flex flex-col gap-1.5 md:gap-2 z-[1000]">
          <button
            onClick={() => setIsChatbotOpen(true)}
            className="bg-heritage-500 hover:bg-heritage-600 text-white p-2.5 md:px-4 md:py-3 rounded-lg shadow-lg transition-colors font-semibold text-sm flex items-center justify-center md:justify-start gap-2"
            aria-label={t('chatbot.buttonText', currentLanguage)}
            title={t('chatbot.buttonText', currentLanguage)}
          >
            <MessageCircle className="w-5 h-5 md:w-4 md:h-4" />
            <span className="hidden md:inline">{t('chatbot.buttonText', currentLanguage)}</span>
          </button>
          <button
            onClick={handleMakeCustomPath}
            className="bg-heritage-600 hover:bg-heritage-700 text-white p-2.5 md:px-4 md:py-3 rounded-lg shadow-lg transition-colors font-semibold text-sm flex items-center justify-center md:justify-start gap-2"
            aria-label={t('customPath.buttonText', currentLanguage)}
            title={t('customPath.buttonText', currentLanguage)}
          >
            <Map className="w-5 h-5 md:w-4 md:h-4" />
            <span className="hidden md:inline">{t('customPath.buttonText', currentLanguage)}</span>
          </button>
          <button
            onClick={handleFindPath}
            className="bg-heritage-700 text-white p-2.5 md:px-4 md:py-3 rounded-lg shadow-lg hover:bg-heritage-800 transition-colors font-semibold text-sm flex items-center justify-center md:justify-start gap-2"
            aria-label={t('map.findMyPath', currentLanguage)}
            title={t('map.findMyPath', currentLanguage)}
          >
            <Navigation className="w-5 h-5 md:w-4 md:h-4" />
            <span className="hidden md:inline">{t('map.findMyPath', currentLanguage)}</span>
          </button>
          <button
            onClick={handleClearRoute}
            className="bg-white dark:bg-neutral-800 text-heritage-700 dark:text-heritage-300 p-2.5 md:px-4 md:py-3 rounded-lg shadow-lg hover:bg-heritage-50 dark:hover:bg-neutral-700 transition-colors font-semibold text-sm border border-heritage-700 dark:border-heritage-400"
            aria-label={t('map.clearRoute', currentLanguage)}
            title={t('map.clearRoute', currentLanguage)}
          >
            <span className="hidden md:inline">{t('map.clearRoute', currentLanguage)}</span>
            <span className="md:hidden text-xs">Clear</span>
          </button>
        </div>
      )}

      {/* Custom Path Modal */}
      <CustomPathModal
        isOpen={isCustomPathModalOpen}
        onClose={handleCloseCustomPathModal}
        onStartRoute={handleStartCustomRoute}
      />

      {/* Chatbot Modal */}
      <ChatbotModal 
        isOpen={isChatbotOpen} 
        onClose={() => setIsChatbotOpen(false)}
        onCreateRoute={createRoute}
        userLocation={userLocation}
      />
    </div>
  );
}

export default MapContainer;