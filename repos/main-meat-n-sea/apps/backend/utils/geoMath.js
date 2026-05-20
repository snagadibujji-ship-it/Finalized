const EARTH_RADIUS_KM = 6371;

const degreesToRadians = (degrees) => (degrees * Math.PI) / 180;

export const haversineDistanceKm = (from, to) => {
  const lat1 = Number(from?.lat);
  const lon1 = Number(from?.lng);
  const lat2 = Number(to?.lat);
  const lon2 = Number(to?.lng);

  if ([lat1, lon1, lat2, lon2].some((value) => Number.isNaN(value))) {
    throw new Error('Invalid coordinates. lat/lng must be numeric values.');
  }

  const dLat = degreesToRadians(lat2 - lat1);
  const dLon = degreesToRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(degreesToRadians(lat1)) * Math.cos(degreesToRadians(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
};

export default { haversineDistanceKm };
