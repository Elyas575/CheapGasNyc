// NYC Gas - Borough Page
// Shared script for all borough pages

function getBoroughName() {
  const path = window.location.pathname.replace(/\/$/, '');
  const parts = path.split('/');
  return parts[parts.length - 1];
}

let currentFuelType = 'Regular Fuel Prices';

function getBrandLogoUrl(stationName) {
  if (!stationName) return null;
  const name = stationName.trim().toLowerCase();
  const brandMap = {
    '7-eleven': '7eleven.png',
    '76': '76.png',
    'amoco': 'amoco.png',
    'bp': 'bp.png',
    'costco': 'costco.png',
    'gulf': 'gulf.png',
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
    
    renderStations(stations);
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

document.addEventListener('DOMContentLoaded', loadBoroughStations);

const fuelTypeSelect = document.getElementById('fuel-type-select');
if (fuelTypeSelect) {
  fuelTypeSelect.addEventListener('change', (e) => {
    currentFuelType = e.target.value;
    loadBoroughStations();
  });
}