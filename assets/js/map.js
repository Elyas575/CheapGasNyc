// NYC Gas - Map Page
// Displays all stations with Google Maps links

let allStations = [];

const BOROUGHS = ['bronx', 'brooklyn', 'manhattan', 'queens', 'staten-island'];

let currentFuelType = 'Regular Fuel Prices';

function getBrandLogoUrl(stationName) {
  if (!stationName) return null;
  const name = stationName.trim().toLowerCase();
  const brandMap = {
    '7-eleven': '7eleven.png',
    '76': '76.png',
    'amoco': 'amoco.png',
    'atlantis': 'atlantis.png',
    'bp': 'bp.png',
    'conoco': 'conoco.png',
    'costco': 'costco.png',
    'global': 'global.png',
    'gulf': 'gulf.png',
    'mobil': 'mobil.png',
    'shell': 'shell.png',
    'speedway': 'speedway.png',
    'sunoco': 'sunoco.png'
  };
  if (brandMap[name]) {
    return `../images/${brandMap[name]}`;
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

function getTrueReportTime(station) {
  if (!station.scraped_at || !station.reported_ago) return null;
  
  const reportedOffset = parseReportedAgoToMs(station.reported_ago);
  if (reportedOffset === null) return null;
  
  const scrapedDate = new Date(station.scraped_at + 'Z');
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

async function loadAllStations() {
  try {
    const promises = BOROUGHS.map(async (borough) => {
      const response = await fetch(`../gas-prices/${borough}/gas-prices.json`);
      const data = await response.json();
      
      let stations = [];
      if (Array.isArray(data)) {
        stations = data.map(s => ({ ...s, borough }));
      } else if (data.fuel_types && typeof data.fuel_types === 'object') {
        const fuelData = data.fuel_types[currentFuelType];
        if (fuelData && fuelData.stations) {
          stations = fuelData.stations.map(s => ({ ...s, borough }));
        }
      }
      return stations;
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
  const address = encodeURIComponent(`${station.address.street}, ${station.address.city}, ${station.address.state} ${station.address.zip}`);
  return `https://www.google.com/maps/search/?api=1&query=${address}`;
}

function getGoogleMapsDirectionsLink(station) {
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

  const sortedStations = allStations.sort((a, b) => {
    const priceA = a.price ? parseFloat(a.price.replace('$', '')) : Infinity;
    const priceB = b.price ? parseFloat(b.price.replace('$', '')) : Infinity;
    return priceA - priceB;
  });

  container.innerHTML = sortedStations.map(station => {
    const mapsLink = getGoogleMapsLink(station);
    const trueReportTime = getTrueReportTime(station);
    const reportedTime = timeAgo(trueReportTime);
    const brandLogo = getBrandLogoUrl(station.name);
    
    return `
      <div class="bg-white border border-gray-200 rounded-lg p-4 mb-3">
        <div class="flex items-center gap-3">
          ${brandLogo ? `<img src="${brandLogo}" alt="${station.name}" class="w-10 h-10 object-contain" onerror="this.style.display='none'">` : ''}
          <div class="flex-1">
            <h3 class="font-bold text-gray-900">${station.name}</h3>
            <p style="margin: 2px 0; font-size: 13px; color: #666;">${station.address.street || ''}</p>
            <p style="margin: 2px 0; font-size: 13px; color: #666;">${station.address.city || ''}, ${station.address.state || ''} ${station.address.zip || ''}</p>
            <div class="font-bold text-lg text-amber-700">${station.price && station.price !== '- - -' ? station.price : '--'}</div>
            <p style="margin: 4px 0; font-size: 12px; color: #999;">${reportedTime}</p>
            <a href="${mapsLink}" target="_blank" style="display: inline-block; margin-top: 8px; padding: 6px 12px; background: #855300; color: white; text-decoration: none; border-radius: 4px; font-size: 12px; font-weight: 600;">View on Google Maps</a>
          </div>
        </div>
      </div>
    `
  });
}

function initMap() {
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

  allStations.forEach(station => {
    const marker = createPriceMarker(station);
    if (marker) {
      markers.push(marker);
    }
  });

  console.log(`Added ${markers.length} markers to map`);
}

document.addEventListener('DOMContentLoaded', () => {
  loadAllStations().then(() => {
    window.initMap = initMap;
  });

  const fuelTypeSelect = document.getElementById('fuel-type-select');
  if (fuelTypeSelect) {
    fuelTypeSelect.addEventListener('change', (e) => {
      currentFuelType = e.target.value;
      loadAllStations();
    });
  }
});