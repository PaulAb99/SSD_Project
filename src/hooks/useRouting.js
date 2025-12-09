import { useEffect, useCallback, useRef } from 'react';
import L from 'leaflet';
import Swal from 'sweetalert2';
import useMapStore from '../stores/mapStore';
import { t } from '../utils/uiTranslations';

function useRouting(mapRef) {
  const routeLayerRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    return () => {
      clearRoute();
    };
  }, []);

  const createRoute = useCallback(async (userLocation, nodes, availableTime = null, skipTimeCheck = false) => {
    // Get the actual map instance from the store if mapRef is not available
    const map = mapRef.current || useMapStore.getState().map;
    // Get current language at execution time, not mount time
    const currentLang = useMapStore.getState().currentLanguage;
    // Get current dark mode state from DOM
    const isDarkMode = document.documentElement.classList.contains('dark');
    if (!map) {
      return { success: false };
    }
    if (!userLocation) {
      return { success: false };
    }
    if (!nodes.length) {
      return { success: false };
    }

    const orsApiKey = import.meta.env.VITE_OPENROUTESERVICE_API_KEY;
    if (!orsApiKey) {
      await Swal.fire({
        title: 'API Key Missing',
        text: 'Please add your OpenRouteService API key to the .env file as VITE_OPENROUTESERVICE_API_KEY',
        icon: 'error',
        confirmButtonColor: '#6f4e35',
        background: isDarkMode ? '#1f2937' : '#ffffff',
        color: isDarkMode ? '#f3f4f6' : '#000000'
      });
      return { success: false };
    }

    // Clear existing route
    clearRoute();

    // Limit waypoints to avoid overwhelming API (max 20 nodes for optimization endpoint)
    const maxNodes = 20;
    const limitedNodes = nodes.length > maxNodes ? nodes.slice(0, maxNodes) : nodes;
    if (nodes.length > maxNodes) {
      await Swal.fire({
        title: 'Route Optimized',
        text: `Showing route to the nearest ${maxNodes} nodes. Discover these first!`,
        icon: 'info',
        confirmButtonColor: '#6f4e35',
        timer: 3000,
        background: isDarkMode ? '#1f2937' : '#ffffff',
        color: isDarkMode ? '#f3f4f6' : '#000000'
      });
    }

    try {
      // Hybrid approach: Use TSP optimization for 4+ nodes, nearest neighbor for fewer
      const useTSP = limitedNodes.length >= 4;
      
      let orderedNodes;
      
      if (useTSP) {
        console.log('🔍 Using TSP optimization for', limitedNodes.length, 'nodes...');
        
        // Use OpenRouteService Optimization API to find the optimal order
        const optimizationUrl = 'https://api.openrouteservice.org/optimization';
        
        // Build jobs (destinations to visit)
        const jobs = limitedNodes.map((node, index) => ({
          id: index + 1,
          service: 600, // 10 minutes per location in seconds
          location: [node.longitude, node.latitude],
          skills: [1]
        }));

        // Build vehicle (starting from user location)
        const vehicle = {
          id: 1,
          profile: 'foot-walking',
          start: [userLocation.lng, userLocation.lat],
          end: [userLocation.lng, userLocation.lat], // Return to start
          skills: [1]
        };

        const optimizationBody = {
          jobs: jobs,
          vehicles: [vehicle],
          options: {
            g: true // Return geometry
          }
        };

        const optimizationResponse = await fetch(optimizationUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': orsApiKey
          },
          body: JSON.stringify(optimizationBody)
        });

        if (!optimizationResponse.ok) {
          const errorText = await optimizationResponse.text();
          console.error('Optimization API error:', errorText);
          throw new Error(`Optimization API error: ${optimizationResponse.status}`);
        }

        const optimizationData = await optimizationResponse.json();
        console.log('✅ TSP Optimization result:', optimizationData);

        // Extract optimized route
        if (!optimizationData.routes || optimizationData.routes.length === 0) {
          throw new Error('No optimized route found');
        }

        const optimizedRoute = optimizationData.routes[0];
        const orderedSteps = optimizedRoute.steps.filter(step => step.type === 'job');
        
        // Reorder nodes based on optimization
        orderedNodes = orderedSteps.map(step => {
          const jobId = step.job - 1; // job IDs start at 1
          return limitedNodes[jobId];
        });

        console.log('📍 TSP optimized order:', orderedNodes.map(n => n.title));
      } else {
        console.log('🔍 Using nearest neighbor for', limitedNodes.length, 'nodes...');
        
        // Nearest Neighbor algorithm for simpler, greedy optimization
        // This ensures we always visit the closest unvisited node
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

        // Nearest Neighbor optimization - always pick closest unvisited node
        const unvisited = [...limitedNodes];
        orderedNodes = [];
        let currentLat = userLocation.lat;
        let currentLon = userLocation.lng;

        while (unvisited.length > 0) {
          // Find nearest unvisited node
          let nearestIndex = 0;
          let nearestDistance = Infinity;

          for (let i = 0; i < unvisited.length; i++) {
            const distance = calculateDistance(
              currentLat,
              currentLon,
              unvisited[i].latitude,
              unvisited[i].longitude
            );
            if (distance < nearestDistance) {
              nearestDistance = distance;
              nearestIndex = i;
            }
          }

          // Add nearest node to ordered list and remove from unvisited
          const nearestNode = unvisited.splice(nearestIndex, 1)[0];
          orderedNodes.push(nearestNode);
          currentLat = nearestNode.latitude;
          currentLon = nearestNode.longitude;
        }

        console.log('📍 Nearest neighbor order:', orderedNodes.map(n => n.title));
      }

      // Build waypoints from ordered nodes
      const waypoints = [
        { lat: userLocation.lat, lng: userLocation.lng },
        ...orderedNodes.map(node => ({ lat: node.latitude, lng: node.longitude }))
      ];

      // Get detailed walking directions for the ordered route
      const coordinates = waypoints.map(wp => [wp.lng, wp.lat]);
      const directionsUrl = 'https://api.openrouteservice.org/v2/directions/foot-walking/geojson';
      
      const directionsBody = {
        coordinates: coordinates,
        preference: 'shortest',
        instructions: false
      };

      const directionsResponse = await fetch(directionsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': orsApiKey
        },
        body: JSON.stringify(directionsBody)
      });

      if (!directionsResponse.ok) {
        throw new Error(`Directions API error: ${directionsResponse.status}`);
      }

      const data = await directionsResponse.json();

      // GeoJSON FeatureCollection format
      if (!data.features || data.features.length === 0) {
        throw new Error('No routes found');
      }

      const feature = data.features[0];
      
      // Check if geometry exists - GeoJSON feature format
      if (!feature.geometry || !feature.geometry.coordinates) {
        throw new Error('Invalid route geometry in response');
      }
      
      const routeCoordinates = feature.geometry.coordinates;
      const polyline = routeCoordinates.map(coord => [coord[1], coord[0]]);
       
      // Draw route on map
      routeLayerRef.current = L.polyline(polyline, {
        color: '#6f4e35',
        weight: 6,
        opacity: 0.8
      }).addTo(map);

      // Add markers for waypoints
      waypoints.forEach((waypoint, i) => {
        const isStart = i === 0;
        let markerIcon;
        if (isStart) {
          markerIcon = L.divIcon({
            className: 'custom-route-marker',
            html: '<div style="background-color: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white;"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });
        } else {
          markerIcon = L.divIcon({
            className: 'custom-route-marker',
            html: `<div style="background-color: #8b6441; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold;">${i}</div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          });
        }

        const marker = L.marker([waypoint.lat, waypoint.lng], {
          icon: markerIcon
        }).addTo(map);
        markersRef.current.push(marker);
      });

      // Calculate total distance and duration from OpenRouteService response
      const totalDistance = feature.properties?.summary?.distance || 0; // in meters
      const totalDuration = feature.properties?.summary?.duration || 0; // in seconds
      const distanceKm = (totalDistance / 1000).toFixed(1);
      const walkingTimeMin = Math.round(totalDuration / 60);
      const visitTimeMin = orderedNodes.length * 10; // 10 min per location
      const totalTimeMin = walkingTimeMin + visitTimeMin;

      // Check if route exceeds available time (with 20% tolerance)
      if (availableTime && !skipTimeCheck) {
        const timeExceeded = totalTimeMin - availableTime;
        const toleranceMinutes = Math.ceil(availableTime * 0.20); // 20% tolerance
        
        if (timeExceeded > toleranceMinutes) {
          // Route significantly exceeds time budget - return route info for retry
          clearRoute();
          return { 
            success: false, 
            timeExceeded: true,
            totalTimeMin,
            availableTime,
            nodes: orderedNodes
          };
        }
      }

      // Show success popup with route details
      const withinBudget = !availableTime || totalTimeMin <= availableTime;
      const slightlyOver = availableTime && totalTimeMin > availableTime && totalTimeMin <= availableTime + Math.ceil(availableTime * 0.20);

      await Swal.fire({
        title: `🎯 ${t('route.routeCreated', currentLang)}`,
        html: `
          <div class="text-left space-y-2">
            ${slightlyOver ? `<p class="text-orange-600 font-semibold mb-2">⚠️ ${t('route.routeSlightlyOver', currentLang)}</p>` : `<p class="text-sm ${isDarkMode ? 'text-green-400' : 'text-green-600'} font-semibold mb-2">✓ ${t('route.routeUses', currentLang)} ${useTSP ? t('route.nearestNeighbor', currentLang) : t('route.nearestNeighbor', currentLang)}</p>`}
            <p><strong>${t('route.distance', currentLang)}:</strong> ${distanceKm} ${t('route.kmWalkingRoute', currentLang)}</p>
            <p><strong>${t('route.walkingTime', currentLang)}:</strong> ${walkingTimeMin} ${t('route.minutes', currentLang)}</p>
            <p><strong>${t('route.visitTime', currentLang)}:</strong> ${visitTimeMin} ${t('route.minutes', currentLang)} (${t('route.minPerLocation', currentLang)})</p>
            <p class="text-lg font-bold ${isDarkMode ? 'text-heritage-400' : 'text-heritage-700'} mt-3">${t('route.totalTime', currentLang)}: ${totalTimeMin} ${t('route.minutes', currentLang)}</p>
            ${availableTime ? `<p class="text-sm ${withinBudget ? (isDarkMode ? 'text-green-400' : 'text-green-600') : 'text-orange-600'}">⚠️ ${t('route.slightlyOverApproved', currentLang)} ${availableTime} ${t('route.minuteBudget', currentLang)}</p>` : ''}
            <p class="text-sm ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'} mt-2">${t('route.visiting', currentLang)} ${orderedNodes.length} ${orderedNodes.length !== 1 ? t('route.locations', currentLang) : t('route.location', currentLang)} (${t('route.alwaysClosest', currentLang)})</p>
            <div class="mt-3 text-xs ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}">
              <p class="font-semibold mb-1">${t('route.routeOrder', currentLang)}:</p>
              <ol class="list-decimal pl-5">
                ${orderedNodes.map(node => `<li>${node.title}</li>`).join('')}
              </ol>
            </div>
          </div>
        `,
        icon: slightlyOver ? 'warning' : 'success',
        confirmButtonColor: '#6f4e35',
        confirmButtonText: 'OK',
        background: isDarkMode ? '#1f2937' : '#ffffff',
        color: isDarkMode ? '#f3f4f6' : '#000000'
      });

      // Fit map to route bounds
      const bounds = L.latLngBounds(polyline);
      map.fitBounds(bounds, {
        padding: [80, 80],
        maxZoom: 16
      });

      return { success: true, totalTimeMin, nodes: orderedNodes };

    } catch (error) {
      console.error('❌ Route creation failed:', error);
      
      // Fallback to simple straight-line path
      console.log('🔄 Falling back to simple path...');
      return await createFallbackOptimizedRoute(userLocation, limitedNodes, map, availableTime, skipTimeCheck);
    }
  }, []);

  // Fallback optimization using Nearest Neighbor algorithm
  const createFallbackOptimizedRoute = async (userLocation, nodes, map, availableTime = null, skipTimeCheck = false) => {
    if (!map || !userLocation || !nodes.length) {
      return { success: false };
    }

    // Get current language at execution time
    const currentLang = useMapStore.getState().currentLanguage;
    // Get current dark mode state from DOM
    const isDarkMode = document.documentElement.classList.contains('dark');

    // Import distance calculation
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

    // Nearest Neighbor TSP approximation
    const optimizeNodeOrder = (startLat, startLon, nodesList) => {
      const unvisited = [...nodesList];
      const ordered = [];
      let currentLat = startLat;
      let currentLon = startLon;

      while (unvisited.length > 0) {
        // Find nearest unvisited node
        let nearestIndex = 0;
        let nearestDistance = Infinity;

        for (let i = 0; i < unvisited.length; i++) {
          const distance = calculateDistance(
            currentLat,
            currentLon,
            unvisited[i].latitude,
            unvisited[i].longitude
          );
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = i;
          }
        }

        // Add nearest node to ordered list
        const nearestNode = unvisited.splice(nearestIndex, 1)[0];
        ordered.push(nearestNode);
        currentLat = nearestNode.latitude;
        currentLon = nearestNode.longitude;
      }

      return ordered;
    };

    // Optimize node order
    const orderedNodes = optimizeNodeOrder(userLocation.lat, userLocation.lng, nodes);
    console.log('📍 Fallback optimized order:', orderedNodes.map(n => n.title));

    // Build waypoints
    const waypoints = [
      { lat: userLocation.lat, lng: userLocation.lng },
      ...orderedNodes.map(node => ({ lat: node.latitude, lng: node.longitude }))
    ];

    // Try to get real walking routes, fallback to straight lines if needed
    const orsApiKey = import.meta.env.VITE_OPENROUTESERVICE_API_KEY;
    
    if (orsApiKey) {
      try {
        const coordinates = waypoints.map(wp => [wp.lng, wp.lat]);
        const url = 'https://api.openrouteservice.org/v2/directions/foot-walking/geojson';
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': orsApiKey
          },
          body: JSON.stringify({
            coordinates: coordinates,
            preference: 'shortest'
          })
        });

        if (response.ok) {
          const data = await response.json();
          const feature = data.features[0];
          const routeCoordinates = feature.geometry.coordinates;
          const polyline = routeCoordinates.map(coord => [coord[1], coord[0]]);
          
          // Draw route
          routeLayerRef.current = L.polyline(polyline, {
            color: '#6f4e35',
            weight: 6,
            opacity: 0.8
          }).addTo(map);

          // Add markers
          addRouteMarkers(waypoints, map);

          // Calculate totals
          const totalDistance = feature.properties?.summary?.distance || 0;
          const totalDuration = feature.properties?.summary?.duration || 0;
          const distanceKm = (totalDistance / 1000).toFixed(1);
          const walkingTimeMin = Math.round(totalDuration / 60);
          const visitTimeMin = orderedNodes.length * 10;
          const totalTimeMin = walkingTimeMin + visitTimeMin;

          // Check if route exceeds available time (with 20% tolerance)
          if (availableTime && !skipTimeCheck) {
            const timeExceeded = totalTimeMin - availableTime;
            const toleranceMinutes = Math.ceil(availableTime * 0.20);
            
            if (timeExceeded > toleranceMinutes) {
              clearRoute();
              return { 
                success: false, 
                timeExceeded: true,
                totalTimeMin,
                availableTime,
                nodes: orderedNodes
              };
            }
          }

          // Show success popup
          const withinBudget = !availableTime || totalTimeMin <= availableTime;
          const slightlyOver = availableTime && totalTimeMin > availableTime && totalTimeMin <= availableTime + Math.ceil(availableTime * 0.20);

          await Swal.fire({
            title: '✓ Optimized Route Created!',
            html: `
              <div class="text-left space-y-2">
                ${slightlyOver ? '<p class="text-orange-600 font-semibold mb-2">⚠️ Route slightly exceeds your time budget but within tolerance</p>' : `<p class="text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} font-semibold mb-2">Using nearest-neighbor optimization</p>`}
                <p><strong>Distance:</strong> ${distanceKm} km</p>
                <p><strong>Walking time:</strong> ${walkingTimeMin} min</p>
                <p><strong>Visit time:</strong> ${visitTimeMin} min</p>
                <p class="text-lg font-bold ${isDarkMode ? 'text-heritage-400' : 'text-heritage-700'} mt-3">Total: ${totalTimeMin} min</p>
                ${availableTime ? `<p class="text-sm ${withinBudget ? (isDarkMode ? 'text-green-400' : 'text-green-600') : 'text-orange-600'}">${withinBudget ? '✓ Within' : '⚠️ Slightly over (approved)'} your ${availableTime} minute budget</p>` : ''}
                <p class="text-sm ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'} mt-2">${orderedNodes.length} locations</p>
                <div class="mt-3 text-xs ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}">
                  <p class="font-semibold mb-1">Route order:</p>
                  <ol class="list-decimal pl-5">
                    ${orderedNodes.map(node => `<li>${node.title}</li>`).join('')}
                  </ol>
                </div>
              </div>
            `,
            icon: slightlyOver ? 'warning' : 'success',
            confirmButtonColor: '#6f4e35',
            confirmButtonText: 'OK',
            background: isDarkMode ? '#1f2937' : '#ffffff',
            color: isDarkMode ? '#f3f4f6' : '#000000'
          });

          // Fit bounds
          const bounds = L.latLngBounds(polyline);
          map.fitBounds(bounds, { padding: [80, 80], maxZoom: 16 });

          return { success: true, totalTimeMin, nodes: orderedNodes };
        }
      } catch (err) {
        console.error('Fallback route API failed:', err);
      }
    }

    // Ultimate fallback: straight lines
    return createSimplePath(waypoints, orderedNodes, availableTime, skipTimeCheck);
  };

  // Helper function to add route markers
  const addRouteMarkers = (waypoints, map) => {
    waypoints.forEach((waypoint, i) => {
      const isStart = i === 0;
      let markerIcon;
      
      if (isStart) {
        markerIcon = L.divIcon({
          className: 'custom-route-marker',
          html: '<div style="background-color: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white;"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });
      } else {
        markerIcon = L.divIcon({
          className: 'custom-route-marker',
          html: `<div style="background-color: #8b6441; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold;">${i}</div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });
      }

      const marker = L.marker([waypoint.lat, waypoint.lng], {
        icon: markerIcon
      }).addTo(map);
      markersRef.current.push(marker);
    });
  };

  const clearRoute = useCallback(() => {
    const map = mapRef.current || useMapStore.getState().map;
    if (routeLayerRef.current && map) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    markersRef.current.forEach(marker => {
      if (map) {
        map.removeLayer(marker);
      }
    });
    markersRef.current = [];
  }, []);

  // Fallback: Create simple straight-line path
  function createSimplePath(waypoints, orderedNodes = null, availableTime = null, skipTimeCheck = false) {
    const map = mapRef.current || useMapStore.getState().map;
    // Get current dark mode state from DOM
    const isDarkMode = document.documentElement.classList.contains('dark');
    if (!map) return { success: false };
    
    const coordinates = waypoints.map(w => [w.lat, w.lng]);
    routeLayerRef.current = L.polyline(coordinates, {
      color: '#6f4e35',
      weight: 6,
      opacity: 0.8,
      dashArray: '10, 10'
    }).addTo(map);

    // Add markers
    addRouteMarkers(waypoints, map);

    // Calculate approximate distance
    let totalDistance = 0;
    for (let i = 0; i < coordinates.length - 1; i++) {
      const [lat1, lng1] = coordinates[i];
      const [lat2, lng2] = coordinates[i + 1];
      // Haversine formula
      const R = 6371e3;
      const φ1 = (lat1 * Math.PI) / 180;
      const φ2 = (lat2 * Math.PI) / 180;
      const Δφ = ((lat2 - lat1) * Math.PI) / 180;
      const Δλ = ((lng2 - lng1) * Math.PI) / 180;
      const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      totalDistance += R * c;
    }

    const distanceKm = (totalDistance / 1000).toFixed(1);
    const walkingTimeMin = Math.round(totalDistance / 1.4); // ~1.4 m/s walking speed
    const visitTimeMin = (waypoints.length - 1) * 10;
    const totalTimeMin = walkingTimeMin + visitTimeMin;

    // Check if route exceeds available time (with 20% tolerance)
    if (availableTime && !skipTimeCheck) {
      const timeExceeded = totalTimeMin - availableTime;
      const toleranceMinutes = Math.ceil(availableTime * 0.20);
      
      if (timeExceeded > toleranceMinutes) {
        clearRoute();
        return { 
          success: false, 
          timeExceeded: true,
          totalTimeMin,
          availableTime,
          nodes: orderedNodes || []
        };
      }
    }

    const withinBudget = !availableTime || totalTimeMin <= availableTime;
    const slightlyOver = availableTime && totalTimeMin > availableTime && totalTimeMin <= availableTime + Math.ceil(availableTime * 0.20);

    Swal.fire({
      title: 'Simple Route Created',
      html: `
        <div class="text-left space-y-2">
          ${slightlyOver ? '<p class="text-orange-600 font-semibold mb-2">⚠️ Route slightly exceeds your time budget but within tolerance</p>' : `<p class="text-sm ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'} mb-2">Using straight-line approximation</p>`}
          <p><strong>Approx. distance:</strong> ${distanceKm} km</p>
          <p><strong>Est. walking time:</strong> ${walkingTimeMin} min</p>
          <p><strong>Visit time:</strong> ${visitTimeMin} min</p>
          <p class="text-lg font-bold ${isDarkMode ? 'text-heritage-400' : 'text-heritage-700'} mt-3">Total: ~${totalTimeMin} min</p>
          ${availableTime ? `<p class="text-sm ${withinBudget ? (isDarkMode ? 'text-green-400' : 'text-green-600') : 'text-orange-600'}">${withinBudget ? '✓ Within' : '⚠️ Slightly over (approved)'} your ${availableTime} minute budget</p>` : ''}
          ${orderedNodes ? `
            <div class="mt-3 text-xs ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}">
              <p class="font-semibold mb-1">Route order:</p>
              <ol class="list-decimal pl-5">
                ${orderedNodes.map(node => `<li>${node.title}</li>`).join('')}
              </ol>
            </div>
          ` : ''}
        </div>
      `,
      icon: slightlyOver ? 'warning' : 'info',
      confirmButtonColor: '#6f4e35',
      confirmButtonText: 'OK',
      background: isDarkMode ? '#1f2937' : '#ffffff',
      color: isDarkMode ? '#f3f4f6' : '#000000'
    });

    // Fit map to show all waypoints
    const bounds = L.latLngBounds(coordinates);
    map.fitBounds(bounds, {
      padding: [80, 80],
      maxZoom: 16
    });

    return { success: true, totalTimeMin, nodes: orderedNodes || [] };
  }

  return {
    createRoute,
    clearRoute
  };
}

export default useRouting;