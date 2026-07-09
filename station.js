// NYC Gas - Station Detail Page
// Loads station details and displays them

let currentStation = null;
let stationMap;

// Get station ID from URL query parameter
function getStationId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

// Get station data from localStorage or fetch from JSON
async function loadStationData() {
  const stationId = getStationId();
  if (!stationId) {
    showError('No station ID provided');
    return;
  }

  try {
    // Try to get from localStorage first (for demo purposes)
    const stored = localStorage.getItem('station_' + stationId);
    if (stored) {
      currentStation = JSON.parse(stored);
      displayStation(currentStation);
      return;
    }

    // Otherwise, search through all boroughs
    const BOROUGHS = ['bronx', 'brooklyn', 'manhattan', 'queens', 'staten-island'];
    for (const borough of BOROUGHS) {
      const response = await fetch(`../gas-prices/${borough}/gas-prices.json`);
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
  document.getElementById('breadcrumb-borough').textContent = 
    station.borough ? station.borough.charAt(0).toUpperCase() + station.borough.slice(1) : 'Unknown';
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

  // Update reporters
  const reporter = station.reported_by || 'Unknown';
  const timeAgo = station.reported_ago || 'Unknown';
  document.getElementById('price-regular-reporter').textContent = `${reporter} · ${timeAgo}`;
  document.getElementById('price-midgrade-reporter').textContent = `${reporter} · ${timeAgo}`;
  document.getElementById('price-premium-reporter').textContent = `${reporter} · ${timeAgo}`;

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

  // Load reviews (dummy data for now)
  loadReviews(station);
}

function initStationMap(station) {
  const mapDiv = document.getElementById('station-map');
  if (!mapDiv) return;

  // Check if Google Maps API is loaded
  if (typeof google === 'undefined' || !google.maps) {
    mapDiv.innerHTML = '<div class="flex items-center justify-center h-full bg-surface-container-low rounded-lg text-outline text-sm p-4">Map unavailable - API key required</div>';
    return;
  }

  const location = { lat: parseFloat(station.geo.lat), lng: parseFloat(station.geo.lng) };

  try {
    stationMap = new google.maps.Map(mapDiv, {
      zoom: 15,
      center: location,
      mapTypeId: 'roadmap'
    });

    // Add marker
    new google.maps.Marker({
      position: location,
      map: stationMap,
      title: station.name,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#855300',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2
      }
    });
  } catch (error) {
    console.error('Failed to initialize map:', error);
    mapDiv.innerHTML = '<div class="flex items-center justify-center h-full bg-surface-container-low rounded-lg text-outline text-sm p-4">Map loading failed</div>';
  }
}

function loadReviews(station) {
  const container = document.getElementById('reviews-container');
  
  // Dummy reviews for demo
  const reviews = [
    {
      user: 'rsbkn',
      date: '11 Hours Ago',
      text: 'Good prices here, always clean station.',
      helpful: 8
    },
    {
      user: 'blader3',
      date: '9 Hours Ago',
      text: 'Convenient location, fair prices.',
      helpful: 5
    }
  ];

  container.innerHTML = reviews.map(review => `
    <div class="p-4 bg-surface-container-low rounded-lg">
      <div class="flex items-center gap-2 mb-2">
        <div class="w-8 h-8 bg-secondary text-white rounded-full flex items-center justify-center font-bold text-sm">
          ${review.user.charAt(0).toUpperCase()}
        </div>
        <div>
          <p class="font-medium text-sm">${review.user}</p>
          <p class="text-xs text-outline">${review.date}</p>
        </div>
      </div>
      <p class="text-sm mb-2">${review.text}</p>
      <div class="flex items-center gap-2">
        <button class="text-xs text-outline hover:text-primary transition-colors">
          <span class="material-symbols-outlined text-sm">thumb_up</span>
          ${review.helpful} Agree
        </button>
        <button class="text-xs text-outline hover:text-primary transition-colors">
          Flag as inappropriate
        </button>
      </div>
    </div>
  `).join('');
}

function showError(message) {
  document.getElementById('station-name').textContent = 'Error';
  document.getElementById('station-address').textContent = message;
}

// Load station when page loads
document.addEventListener('DOMContentLoaded', loadStationData);