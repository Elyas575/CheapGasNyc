// NYC Gas - Borough Page
// Shared script for all borough pages

function getBoroughName() {
  const path = window.location.pathname.replace(/\/$/, '');
  const parts = path.split('/');
  return parts[parts.length - 1];
}

let currentFuelType = 'Regular Fuel Prices';

async function loadBoroughStations() {
  const container = document.getElementById('station-list');
  if (!container) return;

  container.innerHTML = '<div class="p-4 text-center text-outline">Loading stations...</div>';

  try {
    const response = await fetch('gas-prices.json');
    const data = await response.json();
    
    let stations = [];
    
    // Format 1: Flat array (Bronx, Brooklyn, Queens, Staten Island)
    if (Array.isArray(data)) {
      stations = data;
    // Format 2: { fuel_types: { "Regular Fuel Prices": { stations: [...] } } } (Manhattan)
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
    return parseFloat(a.price.replace('$', '')) - parseFloat(b.price.replace('$', ''));
  });

  const container = document.getElementById('station-list');
  container.innerHTML = '';

  sorted.forEach((station) => {
    const row = document.createElement('a');
    row.href = `../../station.html?id=${encodeURIComponent(station.url)}`;
    row.className = 'price-row block bg-white border border-outline-variant rounded-lg p-4 mb-3 hover:border-secondary transition-all no-underline';
    
    // Build address parts - show street on one line, city/state on another
    const street = station.address.street || '';
    const cityState = [station.address.city, station.address.state].filter(Boolean).join(', ') || '';
    
    // Show price or -- if not available
    const displayPrice = station.price && station.price !== '- - -' ? station.price : '--';
    
    // Generate star rating (placeholder)
    const starRating = '★★☆☆☆';
    const reviewCount = '135';
    
    // Get reporter info
    const reporterName = station.reported_by || 'Anonymous';
    const reportedTime = station.reported_ago || 'Unknown';
    const priceType = station.price_type || 'Credit';
    
    // Show CASH badge if applicable
    const showCashBadge = priceType === 'Cash';
    
    row.innerHTML = `
      <div class="flex items-center gap-4">
        <div class="w-16 h-16 bg-white border border-outline-variant rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
          <span class="material-symbols-outlined text-4xl text-outline">local_gas_station</span>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="font-station-name text-station-name font-bold text-primary mb-1">${station.name}</h3>
          <div class="flex items-center gap-1 mb-1">
            <span class="text-yellow-500 text-sm">${starRating}</span>
            <span class="text-xs text-outline">${reviewCount}</span>
          </div>
          ${street ? `<p class="font-metadata-sm text-metadata-sm text-outline">${street}</p>` : ''}
          ${cityState ? `<p class="font-metadata-sm text-metadata-sm text-outline">${cityState}</p>` : ''}
        </div>
        <div class="text-right flex-shrink-0">
          <div class="font-price-display text-price-display text-primary mb-1">${displayPrice}</div>
          <div class="flex items-center gap-1 text-xs text-outline mb-1">
            <span class="material-symbols-outlined text-[10px]">person</span>
            <span>${reporterName}</span>
          </div>
          <div class="flex items-center gap-1 text-xs text-outline">
            <span class="material-symbols-outlined text-[10px]">schedule</span>
            <span>${reportedTime}</span>
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
