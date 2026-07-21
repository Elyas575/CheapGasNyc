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
  // Extract the numeric ID from the URL (e.g., "151842" from "station/151842")
  const match = url.match(/\/?station\/(\d+)/);
  return match ? match[1] : url;
}

function getBrandLogoUrl(stationName) {
  if (!stationName) return null;
  const name = stationName.trim().toLowerCase();
  const brandMap = {
    '76': '76.png',
    'amoco': 'amoco.png',
    'gulf': 'gulf.png',
    'mobil': 'mobil.png',
    'shell': 'shell.png',
    'sunoco': 'sunoco.png'
  };
  if (brandMap[name]) {
    return `images/${brandMap[name]}`;
  }
  return null;
}

function parseReportedAgoToMs(reportedAgo) {
  if (!reportedAgo || reportedAgo.trim() === '- - -') return null;
  const match = reportedAgo.trim().match(/(\d+)\s+(Hour|Hours|Day|Days|Minute|Minutes)\s+Ago/i);
  if (!match) return null;

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  if (unit.includes('day')) return value * 24 * 60 * 60 * 1000;
  if (unit.includes('minute')) return value * 60 * 1000;
  return value * 60 * 60 * 1000; // hours
}

function getTrueReportTime(reportedAgo, scrapedAt) {
  if (!scrapedAt || !reportedAgo) return null;
  
  const reportedOffset = parseReportedAgoToMs(reportedAgo);
  if (reportedOffset === null) return null;
  
  const scrapedDate = new Date(scrapedAt + 'Z');
  return new Date(scrapedDate.getTime() - reportedOffset);
}

function timeAgo(trueReportTime) {
  if (!trueReportTime) return 'Unknown';
  const now = new Date();
  const diffMs = now - trueReportTime;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays >= 1 && diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return trueReportTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Update all times on the page every 60 seconds
function updateAllTimes() {
  if (!currentStation) return;
  
  const fuelTypes = ['Regular Fuel Prices', 'Mid-Grade Fuel Prices', 'Premium Fuel Prices', 'Diesel Fuel Prices', 'E85 Fuel Prices'];
  const elementIds = ['time-regular', 'time-midgrade', 'time-premium', 'time-diesel', 'time-e85'];
  
  fuelTypes.forEach((fuelType, index) => {
    const fuelStation = currentStation.fuel_types?.[fuelType];
    const reportedAgo = fuelStation?.reported_ago || (fuelType === 'Regular Fuel Prices' ? currentStation.reported_ago : null);
    
    if (reportedAgo) {
      const scrapedAt = fuelStation?.scraped_at || currentStation.extracted_at;
      const trueReportTime = getTrueReportTime(reportedAgo, scrapedAt);
      if (trueReportTime) {
        const el = document.getElementById(elementIds[index]);
        if (el) {
          el.textContent = timeAgo(trueReportTime);
        }
      }
    }
  });
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
        currentStation = { ...foundStation, borough, extracted_at: data.extracted_at || null };
        displayStation(currentStation);
        updateAllTimes();
        // Update times every 60 seconds
        setInterval(updateAllTimes, 60000);
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

function formatTimestamp(extractedAt) {
  if (!extractedAt) return 'Unknown';
  
  const date = new Date(extractedAt);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  // Format the date nicely
  const options = { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true };
  const formattedDate = date.toLocaleDateString('en-US', options);
  
  // Show relative time if recent
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago (${formattedDate})`;
  if (diffHours < 24) return `${diffHours} hr ago (${formattedDate})`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago (${formattedDate})`;
  
  return formattedDate;
}

function displayStation(station) {
  // Update breadcrumb
  const boroughName = station.borough ? station.borough.charAt(0).toUpperCase() + station.borough.slice(1) : 'Unknown';
  document.getElementById('breadcrumb-borough').textContent = boroughName;
  document.getElementById('breadcrumb-borough').href = `gas-prices/${station.borough || 'brooklyn'}/index.html`;
  document.getElementById('breadcrumb-station').textContent = station.name;

  // Update header - show brand logo if available
  const brandLogo = getBrandLogoUrl(station.name);
  const logoContainer = document.querySelector('.w-20.h-20.bg-white');
  if (logoContainer) {
    if (brandLogo) {
      logoContainer.innerHTML = `<img src="${brandLogo}" alt="${station.name}" class="w-12 h-12 object-contain" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span class="material-symbols-outlined text-5xl text-outline" style="display:none">local_gas_station</span>`;
    } else {
      logoContainer.innerHTML = `<span class="material-symbols-outlined text-5xl text-outline">local_gas_station</span>`;
    }
  }
  document.getElementById('station-name').textContent = station.name;
  const addressStr = station.address.street || station.address.city || station.address.state || 'Address not available';
  document.getElementById('station-address').textContent = addressStr;
  
  // Update timestamp
  const timestampEl = document.getElementById('price-timestamp');
  if (timestampEl) {
    timestampEl.textContent = formatTimestamp(station.extracted_at);
  }

  // Helper to get reported_ago for a fuel type
  function getReportedAgo(fuelTypeKey) {
    const fuelStation = station.fuel_types?.[fuelTypeKey];
    return fuelStation?.reported_ago || null;
  }

  // Update prices for all fuel types
  function getDisplayPrice(price) {
    return (price && price !== '- - -') ? price : '--';
  }
  const regularPrice = getDisplayPrice(station.fuel_types?.['Regular Fuel Prices']?.price || station.price);
  const midgradePrice = getDisplayPrice(station.fuel_types?.['Mid-Grade Fuel Prices']?.price);
  const premiumPrice = getDisplayPrice(station.fuel_types?.['Premium Fuel Prices']?.price);
  const dieselPrice = station.fuel_types?.['Diesel Fuel Prices']?.price || null;
  const e85Price = station.fuel_types?.['E85 Fuel Prices']?.price || null;

  document.getElementById('price-regular').textContent = regularPrice;
  document.getElementById('price-midgrade').textContent = midgradePrice;
  document.getElementById('price-premium').textContent = premiumPrice;
  
  // Set reported_ago for each fuel type
  const reportedAgoRegular = getReportedAgo('Regular Fuel Prices') || station.reported_ago || null;
  const reportedAgoMidgrade = getReportedAgo('Mid-Grade Fuel Prices');
  const reportedAgoPremium = getReportedAgo('Premium Fuel Prices');
  const reportedAgoDiesel = getReportedAgo('Diesel Fuel Prices');
  const reportedAgoE85 = getReportedAgo('E85 Fuel Prices');
  
  const scrapedAtRegular = station.fuel_types?.['Regular Fuel Prices']?.scraped_at || station.extracted_at;
  const scrapedAtMidgrade = station.fuel_types?.['Mid-Grade Fuel Prices']?.scraped_at;
  const scrapedAtPremium = station.fuel_types?.['Premium Fuel Prices']?.scraped_at;
  const scrapedAtDiesel = station.fuel_types?.['Diesel Fuel Prices']?.scraped_at;
  const scrapedAtE85 = station.fuel_types?.['E85 Fuel Prices']?.scraped_at;
  
  const timeRegular = document.getElementById('time-regular');
  if (timeRegular && reportedAgoRegular) {
    timeRegular.setAttribute('data-reported-ago', reportedAgoRegular);
    timeRegular.setAttribute('data-scraped-at', scrapedAtRegular || '');
    const trueReportTime = getTrueReportTime(reportedAgoRegular, scrapedAtRegular);
    timeRegular.textContent = trueReportTime ? timeAgo(trueReportTime) : reportedAgoRegular;
  }
  
  const timeMidgrade = document.getElementById('time-midgrade');
  if (timeMidgrade && reportedAgoMidgrade) {
    timeMidgrade.setAttribute('data-reported-ago', reportedAgoMidgrade);
    timeMidgrade.setAttribute('data-scraped-at', scrapedAtMidgrade || '');
    const trueReportTime = getTrueReportTime(reportedAgoMidgrade, scrapedAtMidgrade);
    timeMidgrade.textContent = trueReportTime ? timeAgo(trueReportTime) : reportedAgoMidgrade;
  }
  
  const timePremium = document.getElementById('time-premium');
  if (timePremium && reportedAgoPremium) {
    timePremium.setAttribute('data-reported-ago', reportedAgoPremium);
    timePremium.setAttribute('data-scraped-at', scrapedAtPremium || '');
    const trueReportTime = getTrueReportTime(reportedAgoPremium, scrapedAtPremium);
    timePremium.textContent = trueReportTime ? timeAgo(trueReportTime) : reportedAgoPremium;
  }
  
  const timeDiesel = document.getElementById('time-diesel');
  if (timeDiesel && reportedAgoDiesel) {
    timeDiesel.setAttribute('data-reported-ago', reportedAgoDiesel);
    timeDiesel.setAttribute('data-scraped-at', scrapedAtDiesel || '');
    const trueReportTime = getTrueReportTime(reportedAgoDiesel, scrapedAtDiesel);
    timeDiesel.textContent = trueReportTime ? timeAgo(trueReportTime) : reportedAgoDiesel;
  }
  
  const timeE85 = document.getElementById('time-e85');
  if (timeE85 && reportedAgoE85) {
    timeE85.setAttribute('data-reported-ago', reportedAgoE85);
    timeE85.setAttribute('data-scraped-at', scrapedAtE85 || '');
    const trueReportTime = getTrueReportTime(reportedAgoE85, scrapedAtE85);
    timeE85.textContent = trueReportTime ? timeAgo(trueReportTime) : reportedAgoE85;
  }
  
  // Show all fuel types (including those with -- prices)
  const dieselCard = document.getElementById('price-diesel');
  const e85Card = document.getElementById('price-e85');
  
  if (dieselCard) {
    dieselCard.style.display = 'block';
    document.getElementById('price-diesel-value').textContent = dieselPrice || '--';
  }
  
  if (e85Card) {
    e85Card.style.display = 'block';
    document.getElementById('price-e85-value').textContent = e85Price || '--';
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