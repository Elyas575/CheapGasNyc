// GasFast NYC - Map Page
// Loads all stations and displays them on an interactive Google Map

let allStations = [];
let map;
let markers = [];

const BOROUGHS = ['bronx', 'brooklyn', 'manhattan', 'queens', 'staten-island'];

async function loadAllStations() {
  try {
    const promises = BOROUGHS.map(async (borough) => {
      const response = await fetch(`../gas-prices/${borough}/gas-prices.json`);
      const stations = await response.json();
      return stations.map(s => ({ ...s, borough }));
    });
    const results = await Promise.all(promises);
    allStations = results.flat();
    console.log(`Loaded ${allStations.length} stations for map`);
  } catch (error) {
    console.error('Failed to load stations for map:', error);
  }
}

function createPriceMarker(station) {
  const price = station.price.replace('$', '');
  const lat = station.geo?.lat;
  const lng = station.geo?.lng;

  if (!lat || !lng) return null;

  // Create custom marker with price label
  const markerContent = `
    <div class="gas-station-marker">
      <div style="font-weight: 700; font-size: 16px; line-height: 1;">${price}</div>
    </div>
  `;

  const marker = new google.maps.Marker({
    position: { lat: parseFloat(lat), lng: parseFloat(lng) },
    map: map,
    title: `${station.name} - ${station.price}`,
    label: {
      text: price,
      color: 'white',
      fontSize: '16px',
      fontWeight: '700'
    },
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 12,
      fillColor: '#855300',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2
    }
  });

  // Add info window on click
  const infoWindow = new google.maps.InfoWindow({
    content: `
      <div style="padding: 8px; min-width: 200px;">
        <h3 style="margin: 0 0 8px 0; font-weight: 600; font-size: 16px;">${station.name}</h3>
        <p style="margin: 4px 0; color: #666; font-size: 14px;">${station.address.street}, ${station.address.city}</p>
        <p style="margin: 4px 0; font-weight: 700; font-size: 20px; color: #855300;">${station.price}</p>
        <p style="margin: 4px 0; font-size: 12px; color: #999;">${station.reported_ago}</p>
        <a href="${station.url}" target="_blank" style="display: inline-block; margin-top: 8px; padding: 6px 12px; background: #855300; color: white; text-decoration: none; border-radius: 4px; font-size: 12px; font-weight: 600;">View on GasBuddy</a>
      </div>
    `
  });

  marker.addListener('click', () => {
    infoWindow.open(map, marker);
  });

  return marker;
}

function initMap() {
  // Center map on NYC
  const nycCenter = { lat: 40.7128, lng: -74.0060 };

  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 11,
    center: nycCenter,
    mapTypeId: 'roadmap',
    styles: [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      }
    ]
  });

  // Add markers for all stations
  allStations.forEach(station => {
    const marker = createPriceMarker(station);
    if (marker) {
      markers.push(marker);
    }
  });

  console.log(`Added ${markers.length} markers to map`);
}

// Load stations and initialize map when page loads
document.addEventListener('DOMContentLoaded', () => {
  loadAllStations().then(() => {
    // Map will be initialized by Google Maps callback
    window.initMap = initMap;
  });
});