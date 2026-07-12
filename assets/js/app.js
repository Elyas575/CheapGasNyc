// NYC Gas - Main Application
// Handles homepage rendering with data from all boroughs

const BOROUGHS = ['bronx', 'brooklyn', 'manhattan', 'queens', 'staten-island'];
const BOROUGH_NAMES = {
  'bronx': 'Bronx',
  'brooklyn': 'Brooklyn',
  'manhattan': 'Manhattan',
  'queens': 'Queens',
  'staten-island': 'Staten Island'
};

let allStations = [];
let currentFuelType = 'Regular Fuel Prices';

// Extract stations from JSON data in either format
function extractStationsFromBorough(data, borough, fuelType) {
  // Format 1: Flat array (Bronx, Brooklyn, Queens, Staten Island)
  if (Array.isArray(data)) {
    return data.map(s => ({ 
      ...s, 
      borough,
      fuel_type: fuelType 
    }));
  }
  
  // Format 2: { fuel_types: { "Regular Fuel Prices": { stations: [...] } } } (Manhattan)
  if (data.fuel_types && typeof data.fuel_types === 'object') {
    const fuelData = data.fuel_types[fuelType];
    if (fuelData && fuelData.stations) {
      return fuelData.stations.map(s => ({ 
        ...s, 
        borough,
        fuel_type: fuelType 
      }));
    }
  }
  
  return [];
}

async function loadAllStations() {
  const container = document.getElementById('station-list');
  if (!container) return;

  container.innerHTML = '<div class="p-4 text-center text-outline">Loading stations...</div>';

  try {
    const promises = BOROUGHS.map(async (borough) => {
      try {
        const response = await fetch(`gas-prices/${borough}/gas-prices.json`);
        if (!response.ok) {
          console.error(`Failed to load ${borough}: HTTP ${response.status}`);
          return [];
        }
        const data = await response.json();
        return extractStationsFromBorough(data, borough, currentFuelType);
      } catch (err) {
        console.error(`Error loading ${borough}:`, err);
        return [];
      }
    });
    const results = await Promise.all(promises);
    allStations = results.flat();
    
    if (allStations.length === 0) {
      container.innerHTML = '<div class="p-4 text-center text-outline">No stations found for the selected fuel type.</div>';
    } else {
      renderStations(allStations);
    }
  } catch (error) {
    console.error('Failed to load stations:', error);
    container.innerHTML = `<div class="p-4 text-center text-outline">Failed to load station data. Please check browser console for details.</div>`;
  }
}

function updateHeading(stations) {
  const heading = document.getElementById('section-heading');
  if (!heading) return;
  
  // Find the cheapest station with a valid price
  const withPrice = stations.filter(s => s.price && s.price !== '- - -' && s.price !== '$0.00');
  if (withPrice.length === 0) {
    heading.textContent = `Cheapest Stations Across NYC`;
    return;
  }
  
  // Find which borough has the cheapest station
  const sorted = [...withPrice].sort((a, b) => 
    parseFloat(a.price.replace('$', '')) - parseFloat(b.price.replace('$', ''))
  );
  const cheapestBorough = BOROUGH_NAMES[sorted[0].borough] || sorted[0].borough;
  const cheapestPrice = sorted[0].price;
  heading.textContent = `Cheapest in ${cheapestBorough} - from ${cheapestPrice}`;
}

function renderStations(stations) {
  const sorted = [...stations].sort((a, b) => {
    return parseFloat(a.price.replace('$', '')) - parseFloat(b.price.replace('$', ''));
  });

  const container = document.getElementById('station-list');
  container.innerHTML = '';

  // Update heading with cheapest borough info
  updateHeading(stations);

  sorted.forEach((station) => {
    const row = document.createElement('a');
    row.href = `station.html?id=${encodeURIComponent(station.url)}`;
    row.className = 'price-row block bg-white border border-outline-variant rounded-lg p-4 mb-3 hover:border-secondary transition-all no-underline';
    
    // Build address parts - include borough name for context across all NYC
    const street = station.address.street || '';
    const cityState = [station.address.city || BOROUGH_NAMES[station.borough], station.address.state].filter(Boolean).join(', ') || BOROUGH_NAMES[station.borough] || '';
    
    // Show price or -- if not available
    const displayPrice = station.price && station.price !== '- - -' ? station.price : '--';
    
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
          ${station.borough ? `<span class="inline-block mt-1 px-2 py-0.5 bg-secondary/10 text-secondary text-xs rounded-full font-medium">${BOROUGH_NAMES[station.borough] || station.borough}</span>` : ''}
        </div>
      </div>
    `;
    container.appendChild(row);
  });
}

// Mobile menu functionality
function openMobileNav() {
  const nav = document.getElementById('mobile-nav');
  const panel = document.getElementById('mobile-nav-panel');
  nav.classList.remove('hidden');
  setTimeout(() => panel.classList.remove('-translate-x-full'), 10);
}

function closeMobileNav() {
  const nav = document.getElementById('mobile-nav');
  const panel = document.getElementById('mobile-nav-panel');
  panel.classList.add('-translate-x-full');
  setTimeout(() => nav.classList.add('hidden'), 300);
}

document.addEventListener('DOMContentLoaded', () => {
  const menuBtn = document.getElementById('mobile-menu-btn');
  if (menuBtn) menuBtn.addEventListener('click', openMobileNav);

  const mobileNav = document.getElementById('mobile-nav');
  if (mobileNav) mobileNav.addEventListener('click', (e) => { if (e.target === mobileNav) closeMobileNav(); });

  loadAllStations();

  const searchInput = document.getElementById('homepage-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      if (!query) {
        renderStations(allStations);
        return;
      }
      const filtered = allStations.filter(s =>
        s.name.toLowerCase().includes(query) ||
        (s.address.street && s.address.street.toLowerCase().includes(query)) ||
        (s.address.city && s.address.city.toLowerCase().includes(query)) ||
        (s.address.zip && s.address.zip.includes(query))
      );
      renderStations(filtered);
    });
  }

  const fuelTypeSelect = document.getElementById('fuel-type-select');
  if (fuelTypeSelect) {
    fuelTypeSelect.addEventListener('change', (e) => {
      currentFuelType = e.target.value;
      loadAllStations();
    });
  }
});
