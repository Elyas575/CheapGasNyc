// NYC Gas - Borough Page
// Shared script for all borough pages

function getBoroughName() {
  const path = window.location.pathname.replace(/\/$/, '');
  const parts = path.split('/');
  return parts[parts.length - 1];
}

let currentFuelType = 'Regular Fuel Prices';
let allBoroughStations = [];
let boroughMap = null;
let boroughMarkers = [];

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
    'lukoil': 'lukoil.png',
    'mobil': 'mobil.png',
    'shell': 'shell.png',
    'speedway': 'speedway.png',
    'sunoco': 'sunoco.png'
  };
  if (brandMap[name]) {
    return `../../images/${brandMap[name]}`;
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

async function loadBoroughStations() {
  const container = document.getElementById('station-list');
  if (!container) return;

  container.innerHTML = '<div class="p-4 text-center text-outline">Loading stations...</div>';

  try {
    const response = await fetch('gas-prices.json');
    const data = await response.json();
    
    let stations = [];
    
    if (Array.isArray(data)) {
      stations = data;
    } else if (data.fuel_types && typeof data.fuel_types === 'object') {
      const fuelData = data.fuel_types[currentFuelType];
      if (fuelData && fuelData.stations) {
        stations = fuelData.stations;
      }
    }
    
    allBoroughStations = stations;
    renderStations(stations);
    initBoroughMap(stations);
  } catch (error) {
    console.error('Failed to load stations:', error);
    container.innerHTML = '<div class="p-4 text-center text-outline">Failed to load station data.</div>';
  }
}

function renderStations(stations) {
  const sorted = [...stations].sort((a, b) => {
    const priceA = a.price ? parseFloat(a.price.replace('$', '')) : Infinity;
    const priceB = b.price ? parseFloat(b.price.replace('$', '')) : Infinity;
    return priceA - priceB;
  });

  const container = document.getElementById('station-list');
  container.innerHTML = '';

  if (sorted.length === 0) {
    container.innerHTML = '<div class="p-4 text-center text-outline">No stations found matching your search.</div>';
    return;
  }

  sorted.forEach((station) => {
    const row = document.createElement('a');
    const numericId = station.url ? station.url.match(/\/?station\/(\d+)/)?.[1] || station.url : '';
    row.href = `../../station.html?id=${encodeURIComponent(numericId)}`;
    row.className = 'price-row block bg-white border border-outline-variant rounded-lg p-4 mb-3 hover:border-secondary transition-all no-underline';
    row._stationData = station;
    
    const street = station.address.street || '';
    const cityState = [station.address.city, station.address.state].filter(Boolean).join(', ') || '';
    const displayPrice = station.price && station.price !== '- - -' ? station.price : '--';
    
    const trueReportTime = getTrueReportTime(station);
    const reportedTime = timeAgo(trueReportTime);
    const priceType = station.price_type || 'Credit';
    const showCashBadge = priceType === 'Cash';
    
    const brandLogo = getBrandLogoUrl(station.name);
    const logoHtml = brandLogo
      ? `<img src="${brandLogo}" alt="${station.name}" class="w-10 h-10 object-contain" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span class="material-symbols-outlined text-4xl text-outline" style="display:none">local_gas_station</span>`
      : `<span class="material-symbols-outlined text-4xl text-outline">local_gas_station</span>`;

    row.innerHTML = `
      <div class="flex items-center gap-4">
        <div class="w-16 h-16 bg-white border border-outline-variant rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
          ${logoHtml}
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="font-station-name text-station-name font-bold text-primary mb-1">${station.name}</h3>
          ${street ? `<p class="font-metadata-sm text-metadata-sm text-outline">${street}</p>` : ''}
          ${cityState ? `<p class="font-metadata-sm text-metadata-sm text-outline">${cityState}</p>` : ''}
        </div>
       <div class="text-right flex-shrink-0">
           <div class="font-price-display text-price-display text-primary mb-1">${displayPrice}</div>
           <div class="flex items-center gap-1 text-xs text-outline">
             <span class="material-symbols-outlined text-[10px]">schedule</span>
             <span class="time-display">${reportedTime}</span>
           </div>
           ${showCashBadge ? '<span class="inline-block mt-1 px-2 py-0.5 bg-green-600 text-white text-xs rounded-full font-bold">CASH</span>' : ''}
         </div>
      </div>
    `;
    container.appendChild(row);
  });
}

function initBoroughMap(stations) {
  const mapDiv = document.getElementById('borough-map');
  if (!mapDiv) return;
  if (typeof L === 'undefined') return;

  // Destroy previous map instance if it exists
  if (boroughMap) {
    boroughMap.remove();
    boroughMap = null;
  }
  boroughMarkers = [];

  // Filter stations with valid coordinates
  const stationsWithCoords = stations.filter(s => s.geo && s.geo.lat && s.geo.lng);
  if (stationsWithCoords.length === 0) return;

  // Calculate bounds to fit all markers
  const bounds = [];
  stationsWithCoords.forEach(s => {
    const lat = parseFloat(s.geo.lat);
    const lng = parseFloat(s.geo.lng);
    if (!isNaN(lat) && !isNaN(lng)) {
      bounds.push([lat, lng]);
    }
  });

  if (bounds.length === 0) return;

  boroughMap = L.map(mapDiv).fitBounds(bounds, { padding: [30, 30] });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(boroughMap);

  // Add markers for each station with teardrop pin card
  bounds.forEach((latlng, index) => {
    const station = stationsWithCoords[index];
    const price = station.price && station.price !== '- - -' ? station.price : '--';
    const brandLogo = getBrandLogoUrl(station.name);
    
    // Standardized logo: fixed 32x32 square with object-contain
    const logoInner = brandLogo
      ? `<img src="${brandLogo}" alt="" style="width:32px;height:32px;object-fit:contain;display:block;">`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#121416"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;

    // Smaller price font at lower zoom levels to reduce collision
    const priceFontSize = boroughMap.getZoom() <= 13 ? '10px' : '12px';
    const pricePadding = boroughMap.getZoom() <= 13 ? '2px 8px' : '3px 12px';

    // Complete teardrop pin card
    const iconHtml = `
    <div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.25));cursor:pointer;transition:transform 0.15s;">
      <!-- Price badge -->
      <div style="background:#121416;color:#f2b705;font-size:${priceFontSize};font-weight:700;padding:${pricePadding};border-radius:20px;white-space:nowrap;letter-spacing:-0.01em;">${price}</div>
      <!-- Logo lens -->
      <div style="display:flex;align-items:center;justify-content:center;width:46px;height:46px;background:#ffffff;border-radius:10px;margin-top:-2px;box-shadow:inset 0 0 0 1px rgba(0,0,0,0.06);">
        ${logoInner}
      </div>
      <!-- Pointer triangle -->
      <div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:8px solid #ffffff;margin-top:-1px;"></div>
    </div>`;

    const customIcon = L.divIcon({
      html: iconHtml,
      className: '',
      iconSize: [46, 78],
      iconAnchor: [23, 76],
      popupAnchor: [0, -80]
    });

    const marker = L.marker(latlng, {
      icon: customIcon,
      title: station.name
    }).addTo(boroughMap);

    const addressStr = station.address.street ? `${station.address.street}, ${station.address.city || ''}` : (station.address.city || '');
    const mapQuery = encodeURIComponent(`${station.address.street || ''}, ${station.address.city || ''}, ${station.address.state || 'NY'}`);
    
    marker.bindPopup(`
      <div style="font-family:sans-serif;width:200px;border-top:3px solid #f2b705;">
        <div class="p-2">
          <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #f0f0f0;padding-bottom:6px;margin-bottom:6px;">
            <div>
              <div style="font-weight:800;font-size:14px;color:#121416;line-height:1.2;">${station.name}</div>
              <div style="font-size:11px;color:#999;">${addressStr || 'NYC'}</div>
            </div>
            <span style="font-size:10px;background:#d1fae5;color:#065f46;font-weight:700;padding:2px 6px;border-radius:4px;">Regular</span>
          </div>
          <div style="display:flex;align-items:baseline;justify-content:space-between;">
            <span style="font-size:22px;font-weight:900;color:#121416;line-height:1;">${price}<span style="font-size:11px;font-weight:400;color:#aaa;">/gal</span></span>
            <a href="https://maps.google.com/?q=${mapQuery}" target="_blank" style="font-size:12px;font-weight:700;color:#f2b705;text-decoration:none;">Directions →</a>
          </div>
        </div>
      </div>
    `, { offset: L.point(0, -35), className: 'custom-clean-popup' });

    boroughMarkers.push(marker);
  });
}

function filterStations(query) {
  if (!query) {
    renderStations(allBoroughStations);
    return;
  }
  const q = query.toLowerCase().trim();
  const filtered = allBoroughStations.filter(s =>
    s.name.toLowerCase().includes(q) ||
    (s.address.street && s.address.street.toLowerCase().includes(q)) ||
    (s.address.city && s.address.city.toLowerCase().includes(q)) ||
    (s.address.zip && s.address.zip.includes(q))
  );
  renderStations(filtered);
}

document.addEventListener('DOMContentLoaded', function() {
  loadBoroughStations();

  // Search input listener
  const searchInput = document.getElementById('homepage-search');
  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      filterStations(e.target.value);
    });
  }

  // Fuel type selector
  const fuelTypeSelect = document.getElementById('fuel-type-select');
  if (fuelTypeSelect) {
    fuelTypeSelect.addEventListener('change', function(e) {
      currentFuelType = e.target.value;
      loadBoroughStations();
    });
  }
});