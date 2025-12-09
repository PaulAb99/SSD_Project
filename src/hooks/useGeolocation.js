import { useState, useEffect } from 'react';
import { watchUserLocation, clearLocationWatch } from '../utils/permissions';
import useMapStore from '../stores/mapStore';

function useGeolocation() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const setUserLocation = useMapStore((state) => state.setUserLocation);

  useEffect(() => {
    const watchId = watchUserLocation((position) => {
      setUserLocation(position);
      setLoading(false);
      setError(null);
    });

    if (watchId === null) {
      setError("Geolocation is not supported");
      setLoading(false);
    }

    return () => {
      if (watchId !== null) {
        clearLocationWatch(watchId);
      }
    };
  }, [setUserLocation]);

  return { error, loading };
}

export default useGeolocation;
