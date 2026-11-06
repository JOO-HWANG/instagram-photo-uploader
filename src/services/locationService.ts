import exifr from 'exifr';
import { findNearestSuburb, cleanText } from '../constants/data';

export interface LocationDetectionResult {
  postcode: string;
  suburb: string;
  lat: number;
  lng: number;
  source: 'photo_exif' | 'device_gps';
  rawSuburbName?: string;
}

/**
 * Reverse geocodes lat/lng into Australian Suburb & Postcode
 * Uses our server API endpoint with instant local fallback to Hills District database.
 */
export async function reverseGeocodeLatLng(
  lat: number,
  lng: number,
  source: 'photo_exif' | 'device_gps'
): Promise<LocationDetectionResult | null> {
  // First, check if there's a match in our local Sydney Hills database
  const localMatch = findNearestSuburb(lat, lng);

  try {
    const res = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`);
    if (res.ok) {
      const data = await res.json();
      if (data.suburb || data.postcode) {
        const rawSub = data.suburb || (localMatch ? localMatch.suburb : 'Hills');
        const cleanSub = cleanText(rawSub);
        const code = data.postcode || (localMatch ? localMatch.postcode : '2154');
        return {
          postcode: code,
          suburb: cleanSub,
          lat,
          lng,
          source,
          rawSuburbName: rawSub,
        };
      }
    }
  } catch (err) {
    console.warn('Server reverse geocode failed, using local database:', err);
  }

  // Fallback to local database calculation
  if (localMatch) {
    return {
      postcode: localMatch.postcode,
      suburb: localMatch.suburb,
      lat,
      lng,
      source,
      rawSuburbName: localMatch.display.split('-')[1]?.trim() || localMatch.suburb,
    };
  }

  return null;
}

/**
 * Extracts GPS metadata (EXIF) from an image file if present.
 */
export async function extractLocationFromImage(
  file: File
): Promise<LocationDetectionResult | null> {
  try {
    const gps = await exifr.gps(file);
    if (gps && typeof gps.latitude === 'number' && typeof gps.longitude === 'number') {
      return await reverseGeocodeLatLng(gps.latitude, gps.longitude, 'photo_exif');
    }
  } catch (err) {
    console.warn('Could not extract EXIF GPS from photo:', err);
  }
  return null;
}

/**
 * Retrieves the device's current location via HTML5 Geolocation API.
 * Useful when photos do not contain EXIF GPS or when taking photos directly in the field.
 */
export function getCurrentDeviceLocation(): Promise<LocationDetectionResult | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const result = await reverseGeocodeLatLng(latitude, longitude, 'device_gps');
        resolve(result);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
}
