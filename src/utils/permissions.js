export async function requestLocationPermission() {
  if (!("geolocation" in navigator)) {
    return {
      granted: false,
      error: "Geolocation is not supported by your browser"
    };
  }

  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      });
    });

    return {
      granted: true,
      position: {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      }
    };
  } catch (error) {
    let errorMessage = "Location access denied";
    if (error.code === 1) {
      errorMessage = "Please allow location access to use this app";
    } else if (error.code === 2) {
      errorMessage = "Location unavailable. Please check your device settings.";
    } else if (error.code === 3) {
      errorMessage = "Location request timed out. Please try again.";
    }
    
    return {
      granted: false,
      error: errorMessage
    };
  }
}

export function watchUserLocation(callback) {
  if (!("geolocation" in navigator)) {
    return null;
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      callback({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy
      });
    },
    (error) => {
      console.error("Location watch error:", error);
      if (error.code === 1) {
        console.error("Location permission denied");
      } else if (error.code === 2) {
        console.error("Position unavailable");
      } else if (error.code === 3) {
        console.error("Timeout getting position");
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      maximumAge: 1000
    }
  );

  return watchId;
}

export function clearLocationWatch(watchId) {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
  }
}