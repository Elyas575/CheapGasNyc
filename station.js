// NYC Gas - Station Detail Page
// Loads station details and displays them

let currentStation = null;
let stationMap;

// Get station ID from URL query parameter
function getStationId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

// Get station data from JSON files
async function loadStationData() {
  const stationId = getStationId();
  if (!stationId) {
    showError('No station ID provided');
    return;
  }

  try {
    // Search through all boroughs
    const BOROUGHS = ['bronx', 'brooklyn', 'manhattan', 'queens', 'staten-island'];
    for (const borough of BOROUGHS) {
      const response = await fetch(`gas-prices/${borough}/gas-prices.json`);
      const stations = await response.json();
      const station = stations.find(s => s.url.includes(stationId) || s.name === stationId);
      if (station) {
        currentStation = { ...station, borough };
        displayStation(currentStation);
        return;
      }
    }

    showError('Station not found');
  } catch (error) {
    console.error('Failed to load station:', error);
    showError('Failed to load station data');
  }
}

function displayStation(station) {
  // Update breadcrumb
  const boroughName = station.borough ? station.borough.charAt(0).toUpperCase() + station.borough.slice(1) : 'Unknown';
  document.getElementById('breadcrumb-borough').textContent = boroughName;
  document.getElementById('breadcrumb-borough').href = `gas-prices/${station.borough || 'brooklyn'}/index.html`;
  document.getElementById('breadcrumb-station').textContent = station.name;

  // Update header
  document.getElementById('station-name').textContent = station.name;
  document.getElementById('station-address').textContent = 
    `${station.address.street}, ${station.address.city}, ${station.address.state} ${station.address.zip}`;

  // Update rating
  const rating = station.rating?.value || 0;
  const reviewCount = station.rating?.count || 0;
  const stars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
  document.getElementById('station-rating').innerHTML = `
    <div class="flex text-yellow-500 text-sm star-rating">${stars}</div>
    <span class="text-sm text-outline">(${reviewCount} reviews)</span>
  `;

  // Update prices (use the same price for all types since we only have one price in the data)
  const price = station.price || '$0.00';
  document.getElementById('price-regular').textContent = price;
  document.getElementById('price-midgrade').textContent = price;
  document.getElementById('price-premium').textContent = price;

  // Update map query and directions link
  const mapQuery = encodeURIComponent(`${station.address.street}, ${station.address.city}, ${station.address.state}`);
  const directionsLink = document.getElementById('directions-link');
  if (directionsLink) {
    directionsLink.href = `https://maps.google.com/?q=${mapQuery}`;
  }

  // Initialize map if coordinates are available
  if (station.geo?.lat && station.geo?.lng) {
    initStationMap(station);
  }
}

function initStationMap(station) {
  const mapDiv = document.getElementById('station-map');
  if (!mapDiv) return;

  // Check if Leaflet is loaded
  if (typeof L === 'undefined') {
    mapDiv.innerHTML = '<div class="flex items-center justify-center h-full bg-surface-container-low rounded-lg text-outline text-sm p-4">Map unavailable</div>';
    return;
  }

  const location = [parseFloat(station.geo.lat), parseFloat(station.geo.lng)];

  try {
    // Initialize Leaflet map
    stationMap = L.map(mapDiv).setView(location, 15);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(stationMap);

    // Add marker
    L.marker(location, {
      title: station.name
    }).addTo(stationMap);
  } catch (error) {
    console.error('Failed to initialize map:', error);
    mapDiv.innerHTML = '<div class="flex items-center justify-center h-full bg-surface-container-low rounded-lg text-outline text-sm p-4">Map loading failed</div>';
  }
}


function showError(message) {
  document.getElementById('station-name').textContent = 'Error';
  document.getElementById('station-address').textContent = message;
}

// Load station when page loads
document.addEventListener('DOMContentLoaded', loadStationData);