import React, { useEffect, useState } from 'react';
import { Marker } from 'react-leaflet';
import { Icon } from 'leaflet';
import useMapStore from '../../stores/mapStore';
import { isWithinProximity } from '../../utils/distance';

function NodeMarker({ node }) {
  const userLocation = useMapStore((state) => state.userLocation);
  const discoveredNodes = useMapStore((state) => state.discoveredNodes);
  const setSelectedNode = useMapStore((state) => state.setSelectedNode);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    if (userLocation) {
      const unlocked = isWithinProximity(
        userLocation.lat,
        userLocation.lng,
        node.latitude,
        node.longitude,
        node.proximityRadius
      );
      setIsUnlocked(unlocked);
    }
  }, [userLocation, node]);

  const isDiscovered = discoveredNodes.has(node.id);

  const handleMarkerClick = () => {
    console.log('Marker clicked:', node.title);
    setSelectedNode(node);
  };

  const markerIcon = React.useMemo(() => {
    const iconUrl = isDiscovered
      ? 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAzMiA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTYgMEMxMC40NzcyIDAgNiA0LjQ3NzE1IDYgMTBDNiAxNy41IDEzIDE2IDE2IDQ4QzE5IDE2IDI2IDE3LjUgMjYgMTBDMjYgNC40NzcxNSAyMS41MjI4IDAgMTYgMFoiIGZpbGw9IiNkOTc3MDYiLz48Y2lyY2xlIGN4PSIxNiIgY3k9IjEwIiByPSI1IiBmaWxsPSIjZmZmZmZmIi8+PC9zdmc+'
      : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAzMiA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTYgMEMxMC40NzcyIDAgNiA0LjQ3NzE1IDYgMTBDNiAxNy41IDEzIDE2IDE2IDQ4QzE5IDE2IDI2IDE3LjUgMjYgMTBDMjYgNC40NzcxNSAyMS41MjI4IDAgMTYgMFoiIGZpbGw9IiM4YjY0NDEiLz48Y2lyY2xlIGN4PSIxNiIgY3k9IjEwIiByPSI1IiBmaWxsPSIjZmZmZmZmIi8+PC9zdmc+';

    return new Icon({
      iconUrl: iconUrl,
      iconSize: [32, 48],
      iconAnchor: [16, 48],
      popupAnchor: [0, -48],
    });
  }, [isDiscovered]);

  return (
    <Marker
      position={[node.latitude, node.longitude]}
      icon={markerIcon}
      zIndexOffset={isDiscovered ? 1000 : 0}
      className={isUnlocked ? 'marker-pulse unlocked-marker' : ''}
      eventHandlers={{
        click: handleMarkerClick
      }}
    />
  );
}

export default NodeMarker;
