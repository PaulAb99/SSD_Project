import React from 'react';
import { CircleMarker, Circle } from 'react-leaflet';

function UserLocation({ position }) {
  return (
    <>
      <Circle
        center={[position.lat, position.lng]}
        radius={position.accuracy || 50}
        pathOptions={{
          fillColor: '#8b6441',
          fillOpacity: 0.1,
          color: '#8b6441',
          weight: 1,
        }}
      />
      <CircleMarker
        center={[position.lat, position.lng]}
        radius={8}
        pathOptions={{
          fillColor: '#8b6441',
          fillOpacity: 1,
          color: '#ffffff',
          weight: 3,
        }}
      />
    </>
  );
}

export default UserLocation;
