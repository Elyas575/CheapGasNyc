// GasFast NYC - Search Page
// Handles station search functionality

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-input');
  const resultsContainer = document.getElementById('search-results');

  if (!searchInput || !resultsContainer) return;

  let allStations = [];

  let currentFuelType = 'Regular Fuel Prices';

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
    const boroughs = ['bronx', 'brooklyn', 'manhattan', 'queens', 'staten-island'];
    try {
      const promises = boroughs.map(async (b) => {
        const res = await fetch(`../gas-prices/${b}/gas-prices.json`);
        const data = await res.json();
        
        let stations = [];
        if (Array.isArray(data)) {
          stations = data.map(s => ({ ...s, borough: b }));
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

    const sorted = [...filtered].sort((a, b) => {
      const priceA = a.price ? parseFloat(a.price.replace('$', '')) : Infinity;
      const priceB = b.price ? parseFloat(b.price.replace('$', '')) : Infinity;
      return priceA - priceB;
    });

    resultsContainer.innerHTML = '';
    sorted.forEach(station => {
      const link = document.createElement('a');
      const numericId = station.url ? station.url.match(/\/?station\/(\d+)/)?.[1] || station.url : '';
      link.href = `../station.html?id=${encodeURIComponent(numericId)}`;
      link.className = 'price-row block bg-white border border-outline-variant rounded-lg p-4 mb-3 hover:border-secondary transition-all no-underline';
      link._stationData = station;
      
      const street = station.address.street || '';
      const cityState = [station.address.city, station.address.state].filter(Boolean).join(', ') || '';
      const displayPrice = station.price && station.price !== '- - -' ? station.price : '--';
      
      const trueReportTime = getTrueReportTime(station);
      const reportedTime = timeAgo(trueReportTime);
      const priceType = station.price_type || 'Credit';
      const showCashBadge = priceType === 'Cash';
      
      link.innerHTML = `
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
            <div class="flex items-center gap-1 text-xs text-outline">
              <span class="material-symbols-outlined text-[10px]">schedule</span>
              <span class="time-display">${reportedTime}</span>
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