// NYC Gas - Map Page
// Displays all stations with Google Maps links

let allStations = [];

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
    displayStationsList();
  } catch (error) {
    console.error('Failed to load stations for map:', error);
    document.getElementById('stations-list').innerHTML = `
      <div class="col-span-2 text-center py-12">
        <p class="text-outline">Failed to load stations. Please try again later.</p>
      </div>
    `;
  }
}

function getGoogleMapsLink(station) {
  // Create a Google Maps search link for the station
  const address = encodeURIComponent(`${station.address.street}, ${station.address.city}, ${station.address.state} ${station.address.zip}`);
  return `https://www.google.com/maps/search/?api=1&query=${address}`;
}

function getGoogleMapsDirectionsLink(station) {
  // Create a Google Maps directions link
  const address = encodeURIComponent(`${station.address.street}, ${station.address.city}, ${station.address.state} ${station.address.zip}`);
  return `https://www.google.com/maps/dir/?api=1&destination=${address}`;
}

function displayStationsList() {
  const container = document.getElementById('stations-list');
  
  if (allStations.length === 0) {
    container.innerHTML = `
      <div class="col-span-2 text-center py-12">
        <p class="text-outline">No stations found.</p>
      </div>
    `;
    return;
  }

  // Sort stations by price (cheapest first)
  const sortedStations = allStations.sort((a, b) => {
    const priceA = parseFloat(a.price.replace('$', ''));
    const priceB = parseFloat(b.price.replace('$', ''));
    return priceA - priceB;
  });

  container.innerHTML = sortedStations.map(station => {
    const mapsLink = getGoogleMapsLink(station);
    const boroughName = station.borough.charAt(0).toUpperCase() + station.borough.slice(1);
    
    return `
        <p style="margin: 4px 0; font-size: 12px; color: #999;">${station.reported_ago}</p>
        <a href="${mapsLink}" target="_blank" style="display: inline-block; margin-top: 8px; padding: 6px 12px; background: #855300; color: white; text-decoration: none; border-radius: 4px; font-size: 12px; font-weight: 600;">View on Google Maps</a>
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
    mapTypeControl: true,
    mapTypeControlOptions: {
      style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
      position: google.maps.ControlPosition.TOP_RIGHT,
      mapTypeIds: ['roadmap', 'satellite', 'hybrid']
    },
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