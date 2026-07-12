// NYC Gas - Station Detail Page
// Loads station details and displays them

let currentStation = null;
let stationMap;

// Get station ID from URL query parameter
function getStationId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

// Normalize URL for comparison - extract the numeric ID from the URL
function normalizeStationId(url) {
  if (!url) return '';
  // Extract the numeric ID from the end of the URL (e.g., "151842" from "https://www.gasbuddy.com/station/151842")
  const match = url.match(/\/station\/(\d+)/);
  return match ? match[1] : url;
}

// Get station data from JSON files
async function loadStationData() {
  const stationId = getStationId();
  if (!stationId) {
    showError('No station ID provided');
    return;
  }

  const searchId = normalizeStationId(stationId);

  try {
    // Search through all boroughs
    const BOROUGHS = ['bronx', 'brooklyn', 'manhattan', 'queens', 'staten-island'];
    for (const borough of BOROUGHS) {
      const response = await fetch(`gas-prices/${borough}/gas-prices.json`);
      const data = await response.json();
      
      const foundStation = findStationInData(data, searchId);
      if (foundStation) {
        currentStation = { ...foundStation, borough };
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

// Find a station in either format: flat array OR { fuel_types: {...} }
function findStationInData(data, searchId) {
  // Format 1: Flat array (Bronx, Brooklyn, Queens, Staten Island)
  if (Array.isArray(data)) {
    const station = data.find(s => s.url && normalizeStationId(s.url) === searchId);
    if (station) {
      return {
        ...station,
        fuel_types: { 'Regular Fuel Prices': station }
      };
    }
    return null;
  }
  
  // Format 2: { fuel_types: { "Regular Fuel Prices": { stations: [...] } } } (Manhattan)
  if (data.fuel_types && typeof data.fuel_types === 'object') {
    const fuelTypes = data.fuel_types;
    const allFuelData = {};
    let primaryStation = null;

    for (const [fuelType, fuelData] of Object.entries(fuelTypes)) {
      if (fuelData.stations && Array.isArray(fuelData.stations)) {
        const station = fuelData.stations.find(s => s.url && normalizeStationId(s.url) === searchId);
        if (station) {
          allFuelData[fuelType] = station;
          if (!primaryStation) {
            primaryStation = { ...station };
          }
        }
      }
    }

    if (primaryStation) {
      return { ...primaryStation, fuel_types: allFuelData };
    }
  }
  
  return null;
}

function displayStation(station) {
  // Update breadcrumb
  const boroughName = station.borough ? station.borough.charAt(0).toUpperCase() + station.borough.slice(1) : 'Unknown';
  document.getElementById('breadcrumb-borough').textContent = boroughName;
  document.getElementById('breadcrumb-borough').href = `gas-prices/${station.borough || 'brooklyn'}/index.html`;
  document.getElementById('breadcrumb-station').textContent = station.name;

  // Update header
  document.getElementById('station-name').textContent = station.name;
  const addressStr = station.address.street || station.address.city || station.address.state || 'Address not available';
  document.getElementById('station-address').textContent = addressStr;

  // Update prices for all fuel types
  const regularPrice = station.fuel_types?.['Regular Fuel Prices']?.price || station.price || '$0.00';
  const midgradePrice = station.fuel_types?.['Mid-Grade Fuel Prices']?.price || '$0.00';
  const premiumPrice = station.fuel_types?.['Premium Fuel Prices']?.price || '$0.00';
  const dieselPrice = station.fuel_types?.['Diesel Fuel Prices']?.price || null;
  const e85Price = station.fuel_types?.['E85 Fuel Prices']?.price || null;

  document.getElementById('price-regular').textContent = regularPrice;
  document.getElementById('price-midgrade').textContent = midgradePrice;
  document.getElementById('price-premium').textContent = premiumPrice;
  
  // Show/hide diesel and E85 if available
  const dieselCard = document.getElementById('price-diesel');
  const e85Card = document.getElementById('price-e85');
  
  if (dieselCard) {
    if (dieselPrice) {
      dieselCard.style.display = 'block';
      document.getElementById('price-diesel-value').textContent = dieselPrice;
    } else {
      dieselCard.style.display = 'none';
    }
  }
  
  if (e85Card) {
    if (e85Price) {
      e85Card.style.display = 'block';
      document.getElementById('price-e85-value').textContent = e85Price;
    } else {
      e85Card.style.display = 'none';
    }
  }

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