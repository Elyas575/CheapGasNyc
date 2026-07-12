// GasFast NYC - Search Page
// Handles station search functionality

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-input');
  const resultsContainer = document.getElementById('search-results');

  if (!searchInput || !resultsContainer) return;

  let allStations = [];

  let currentFuelType = 'Regular Fuel Prices';

  async function loadAllStations() {
    const boroughs = ['bronx', 'brooklyn', 'manhattan', 'queens', 'staten-island'];
    try {
      const promises = boroughs.map(async (b) => {
        const res = await fetch(`../gas-prices/${b}/gas-prices.json`);
        const data = await res.json();
        
        let stations = [];
        // Format 1: Flat array (Bronx, Brooklyn, Queens, Staten Island)
        if (Array.isArray(data)) {
          stations = data.map(s => ({ ...s, borough: b }));
        // Format 2: { fuel_types: { ... } } (Manhattan)
        } else if (data.fuel_types && typeof data.fuel_types === 'object') {
          const fuelData = data.fuel_types[currentFuelType];
          if (fuelData && fuelData.stations) {
            stations = fuelData.stations.map(s => ({ ...s, borough: b }));
          }
        }
        return stations;
      });
      const results = await Promise.all(promises);
      allStations = results.flat();
    } catch (e) {
      console.error('Failed to load stations for search:', e);
    }
  }

  function renderResults(query) {
    const q = query.toLowerCase().trim();
    if (!q) {
      resultsContainer.innerHTML = '<div class="p-4 text-center text-outline">Start typing to search stations...</div>';
      return;
    }

    const filtered = allStations.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.address.street && s.address.street.toLowerCase().includes(q)) ||
      (s.address.city && s.address.city.toLowerCase().includes(q)) ||
      (s.address.zip && s.address.zip.includes(q))
    );

    if (filtered.length === 0) {
      resultsContainer.innerHTML = '<div class="p-4 text-center text-outline">No stations found.</div>';
      return;
    }

    const sorted = [...filtered].sort((a, b) =>
      parseFloat(a.price.replace('$', '')) - parseFloat(b.price.replace('$', ''))
    );

    resultsContainer.innerHTML = '';
  sorted.forEach(station => {
      const link = document.createElement('a');
      // Use numeric station ID for clean URLs
      const numericId = station.url ? station.url.match(/\/?station\/(\d+)/)?.[1] || station.url : '';
      link.href = `../station.html?id=${encodeURIComponent(numericId)}`;
      link.className = 'price-row block bg-white border border-outline-variant rounded-lg p-4 mb-3 hover:border-secondary transition-all no-underline';
      
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
      
      link.innerHTML = `
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
      resultsContainer.appendChild(link);
    });
  }

  loadAllStations();

  searchInput.addEventListener('input', (e) => {
    renderResults(e.target.value);
  });

  const fuelTypeSelect = document.getElementById('fuel-type-select');
  if (fuelTypeSelect) {
    fuelTypeSelect.addEventListener('change', (e) => {
      currentFuelType = e.target.value;
      loadAllStations();
    });
  }
});
